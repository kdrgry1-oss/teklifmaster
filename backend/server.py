from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, status
from fastapi.responses import FileResponse, StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
from io import BytesIO
import base64
import json
from weasyprint import HTML, CSS
import openpyxl
from openpyxl import Workbook
import tempfile
import aiofiles

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Settings
JWT_SECRET = os.environ.get('JWT_SECRET', 'quotemaster-secret-key-2024')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24

# Create the main app
app = FastAPI(title="QuoteMaster Pro API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Upload directory
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# ============== MODELS ==============

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    company_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    company_name: str
    company_logo: Optional[str] = None
    company_address: Optional[str] = None
    company_phone: Optional[str] = None
    company_tax_number: Optional[str] = None
    trial_end_date: Optional[str] = None
    subscription_status: str = "trial"
    created_at: str

class UserUpdate(BaseModel):
    company_name: Optional[str] = None
    company_address: Optional[str] = None
    company_phone: Optional[str] = None
    company_tax_number: Optional[str] = None

class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    unit: str = "adet"
    unit_price: float
    vat_rate: float = 20.0
    image_url: Optional[str] = None
    sku: Optional[str] = None

class ProductResponse(BaseModel):
    id: str
    user_id: str
    name: str
    description: Optional[str] = None
    unit: str
    unit_price: float
    vat_rate: float
    image_url: Optional[str] = None
    sku: Optional[str] = None
    created_at: str
    updated_at: str

class BankAccountCreate(BaseModel):
    bank_name: str
    iban: str
    account_holder: Optional[str] = None

class BankAccountResponse(BaseModel):
    id: str
    user_id: str
    bank_name: str
    iban: str
    account_holder: Optional[str] = None
    created_at: str

class QuoteItemCreate(BaseModel):
    product_id: str
    product_name: str
    unit: str
    quantity: float
    unit_price: float
    vat_rate: float
    discount_percent: float = 0.0

class QuoteCreate(BaseModel):
    customer_name: str
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_address: Optional[str] = None
    items: List[QuoteItemCreate]
    bank_account_ids: List[str] = []
    validity_days: int = 30
    notes: Optional[str] = None
    include_vat: bool = True

class QuoteItemResponse(BaseModel):
    product_id: str
    product_name: str
    unit: str
    quantity: float
    unit_price: float
    vat_rate: float
    discount_percent: float
    subtotal: float
    vat_amount: float
    total: float

class QuoteResponse(BaseModel):
    id: str
    user_id: str
    quote_number: str
    customer_name: str
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_address: Optional[str] = None
    items: List[QuoteItemResponse]
    bank_accounts: List[BankAccountResponse] = []
    subtotal: float
    total_vat: float
    total: float
    validity_date: str
    notes: Optional[str] = None
    include_vat: bool
    status: str = "draft"
    created_at: str
    updated_at: str

class SubscriptionCreate(BaseModel):
    card_holder_name: str
    card_number: str
    expire_month: str
    expire_year: str
    cvc: str

# ============== AUTH HELPERS ==============

def create_token(user_id: str) -> str:
    payload = {
        "user_id": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token süresi dolmuş")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Geçersiz token")

async def get_current_user(authorization: str = None):
    if not authorization:
        raise HTTPException(status_code=401, detail="Yetkilendirme gerekli")
    
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Geçersiz yetkilendirme")
    except ValueError:
        raise HTTPException(status_code=401, detail="Geçersiz yetkilendirme formatı")
    
    payload = verify_token(token)
    user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Kullanıcı bulunamadı")
    return user

from fastapi import Header

async def get_auth_user(authorization: str = Header(None)):
    return await get_current_user(authorization)

# ============== AUTH ENDPOINTS ==============

@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Bu email zaten kayıtlı")
    
    hashed_password = bcrypt.hashpw(user_data.password.encode(), bcrypt.gensalt()).decode()
    trial_end = datetime.now(timezone.utc) + timedelta(days=7)
    
    user_doc = {
        "id": str(uuid.uuid4()),
        "email": user_data.email,
        "password": hashed_password,
        "company_name": user_data.company_name,
        "company_logo": None,
        "company_address": None,
        "company_phone": None,
        "company_tax_number": None,
        "trial_end_date": trial_end.isoformat(),
        "subscription_status": "trial",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    token = create_token(user_doc["id"])
    user_response = {k: v for k, v in user_doc.items() if k != "password" and k != "_id"}
    
    return {"token": token, "user": user_response}

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    if not user:
        raise HTTPException(status_code=401, detail="Email veya şifre hatalı")
    
    if not bcrypt.checkpw(credentials.password.encode(), user["password"].encode()):
        raise HTTPException(status_code=401, detail="Email veya şifre hatalı")
    
    token = create_token(user["id"])
    user_response = {k: v for k, v in user.items() if k != "password" and k != "_id"}
    
    return {"token": token, "user": user_response}

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_auth_user)):
    return {k: v for k, v in current_user.items() if k != "password"}

@api_router.put("/auth/profile")
async def update_profile(update_data: UserUpdate, current_user: dict = Depends(get_auth_user)):
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    
    if update_dict:
        await db.users.update_one({"id": current_user["id"]}, {"$set": update_dict})
    
    updated_user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0, "password": 0})
    return updated_user

@api_router.post("/auth/upload-logo")
async def upload_logo(file: UploadFile = File(...), current_user: dict = Depends(get_auth_user)):
    content = await file.read()
    encoded = base64.b64encode(content).decode()
    content_type = file.content_type or "image/png"
    data_url = f"data:{content_type};base64,{encoded}"
    
    await db.users.update_one({"id": current_user["id"]}, {"$set": {"company_logo": data_url}})
    
    return {"logo_url": data_url}

# ============== PRODUCT ENDPOINTS ==============

@api_router.get("/products", response_model=List[ProductResponse])
async def get_products(current_user: dict = Depends(get_auth_user)):
    products = await db.products.find({"user_id": current_user["id"]}, {"_id": 0}).to_list(1000)
    return products

@api_router.post("/products", response_model=ProductResponse)
async def create_product(product_data: ProductCreate, current_user: dict = Depends(get_auth_user)):
    now = datetime.now(timezone.utc).isoformat()
    product_doc = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        **product_data.model_dump(),
        "created_at": now,
        "updated_at": now
    }
    await db.products.insert_one(product_doc)
    del product_doc["_id"]
    return product_doc

@api_router.put("/products/{product_id}", response_model=ProductResponse)
async def update_product(product_id: str, product_data: ProductCreate, current_user: dict = Depends(get_auth_user)):
    existing = await db.products.find_one({"id": product_id, "user_id": current_user["id"]})
    if not existing:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")
    
    update_dict = product_data.model_dump()
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.products.update_one({"id": product_id}, {"$set": update_dict})
    updated = await db.products.find_one({"id": product_id}, {"_id": 0})
    return updated

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, current_user: dict = Depends(get_auth_user)):
    result = await db.products.delete_one({"id": product_id, "user_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")
    return {"message": "Ürün silindi"}

# ============== EXCEL IMPORT/EXPORT ==============

@api_router.get("/products/export/excel")
async def export_products_excel(current_user: dict = Depends(get_auth_user)):
    products = await db.products.find({"user_id": current_user["id"]}, {"_id": 0}).to_list(1000)
    
    wb = Workbook()
    ws = wb.active
    ws.title = "Ürünler"
    
    headers = ["SKU", "Ürün Adı", "Açıklama", "Birim", "Birim Fiyat (₺)", "KDV Oranı (%)"]
    ws.append(headers)
    
    for product in products:
        ws.append([
            product.get("sku", ""),
            product.get("name", ""),
            product.get("description", ""),
            product.get("unit", "adet"),
            product.get("unit_price", 0),
            product.get("vat_rate", 20)
        ])
    
    buffer = BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=urunler.xlsx"}
    )

@api_router.post("/products/import/excel")
async def import_products_excel(file: UploadFile = File(...), current_user: dict = Depends(get_auth_user)):
    content = await file.read()
    buffer = BytesIO(content)
    
    try:
        wb = openpyxl.load_workbook(buffer)
        ws = wb.active
        
        imported_count = 0
        updated_count = 0
        
        for row_idx, row in enumerate(ws.iter_rows(min_row=2, values_only=True), start=2):
            if not row or not row[1]:
                continue
            
            sku = str(row[0]) if row[0] else None
            name = str(row[1])
            description = str(row[2]) if row[2] else None
            unit = str(row[3]) if row[3] else "adet"
            unit_price = float(row[4]) if row[4] else 0
            vat_rate = float(row[5]) if row[5] else 20
            
            existing = None
            if sku:
                existing = await db.products.find_one({"sku": sku, "user_id": current_user["id"]})
            
            now = datetime.now(timezone.utc).isoformat()
            
            if existing:
                await db.products.update_one(
                    {"id": existing["id"]},
                    {"$set": {
                        "name": name,
                        "description": description,
                        "unit": unit,
                        "unit_price": unit_price,
                        "vat_rate": vat_rate,
                        "updated_at": now
                    }}
                )
                updated_count += 1
            else:
                product_doc = {
                    "id": str(uuid.uuid4()),
                    "user_id": current_user["id"],
                    "sku": sku,
                    "name": name,
                    "description": description,
                    "unit": unit,
                    "unit_price": unit_price,
                    "vat_rate": vat_rate,
                    "image_url": None,
                    "created_at": now,
                    "updated_at": now
                }
                await db.products.insert_one(product_doc)
                imported_count += 1
        
        return {"imported": imported_count, "updated": updated_count}
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Excel dosyası okunamadı: {str(e)}")

# ============== BANK ACCOUNT ENDPOINTS ==============

@api_router.get("/bank-accounts", response_model=List[BankAccountResponse])
async def get_bank_accounts(current_user: dict = Depends(get_auth_user)):
    accounts = await db.bank_accounts.find({"user_id": current_user["id"]}, {"_id": 0}).to_list(100)
    return accounts

@api_router.post("/bank-accounts", response_model=BankAccountResponse)
async def create_bank_account(account_data: BankAccountCreate, current_user: dict = Depends(get_auth_user)):
    account_doc = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        **account_data.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.bank_accounts.insert_one(account_doc)
    del account_doc["_id"]
    return account_doc

@api_router.delete("/bank-accounts/{account_id}")
async def delete_bank_account(account_id: str, current_user: dict = Depends(get_auth_user)):
    result = await db.bank_accounts.delete_one({"id": account_id, "user_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Banka hesabı bulunamadı")
    return {"message": "Banka hesabı silindi"}

# ============== QUOTE ENDPOINTS ==============

async def get_next_quote_number(user_id: str) -> str:
    last_quote = await db.quotes.find_one(
        {"user_id": user_id},
        sort=[("created_at", -1)]
    )
    
    year = datetime.now().year
    if last_quote and last_quote.get("quote_number", "").startswith(f"TKL-{year}"):
        try:
            last_num = int(last_quote["quote_number"].split("-")[-1])
            return f"TKL-{year}-{str(last_num + 1).zfill(4)}"
        except:
            pass
    
    return f"TKL-{year}-0001"

@api_router.get("/quotes", response_model=List[QuoteResponse])
async def get_quotes(current_user: dict = Depends(get_auth_user)):
    quotes = await db.quotes.find({"user_id": current_user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return quotes

@api_router.get("/quotes/{quote_id}", response_model=QuoteResponse)
async def get_quote(quote_id: str, current_user: dict = Depends(get_auth_user)):
    quote = await db.quotes.find_one({"id": quote_id, "user_id": current_user["id"]}, {"_id": 0})
    if not quote:
        raise HTTPException(status_code=404, detail="Teklif bulunamadı")
    return quote

@api_router.post("/quotes", response_model=QuoteResponse)
async def create_quote(quote_data: QuoteCreate, current_user: dict = Depends(get_auth_user)):
    now = datetime.now(timezone.utc)
    validity_date = now + timedelta(days=quote_data.validity_days)
    
    # Calculate items with totals
    items = []
    subtotal = 0
    total_vat = 0
    
    for item in quote_data.items:
        item_subtotal = item.quantity * item.unit_price
        discount_amount = item_subtotal * (item.discount_percent / 100)
        item_subtotal_after_discount = item_subtotal - discount_amount
        vat_amount = item_subtotal_after_discount * (item.vat_rate / 100) if quote_data.include_vat else 0
        item_total = item_subtotal_after_discount + vat_amount
        
        items.append({
            "product_id": item.product_id,
            "product_name": item.product_name,
            "unit": item.unit,
            "quantity": item.quantity,
            "unit_price": item.unit_price,
            "vat_rate": item.vat_rate,
            "discount_percent": item.discount_percent,
            "subtotal": round(item_subtotal_after_discount, 2),
            "vat_amount": round(vat_amount, 2),
            "total": round(item_total, 2)
        })
        
        subtotal += item_subtotal_after_discount
        total_vat += vat_amount
    
    # Get bank accounts
    bank_accounts = []
    if quote_data.bank_account_ids:
        accounts = await db.bank_accounts.find(
            {"id": {"$in": quote_data.bank_account_ids}, "user_id": current_user["id"]},
            {"_id": 0}
        ).to_list(10)
        bank_accounts = accounts
    
    quote_doc = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "quote_number": await get_next_quote_number(current_user["id"]),
        "customer_name": quote_data.customer_name,
        "customer_email": quote_data.customer_email,
        "customer_phone": quote_data.customer_phone,
        "customer_address": quote_data.customer_address,
        "items": items,
        "bank_accounts": bank_accounts,
        "subtotal": round(subtotal, 2),
        "total_vat": round(total_vat, 2),
        "total": round(subtotal + total_vat, 2),
        "validity_date": validity_date.isoformat(),
        "notes": quote_data.notes,
        "include_vat": quote_data.include_vat,
        "status": "draft",
        "created_at": now.isoformat(),
        "updated_at": now.isoformat()
    }
    
    await db.quotes.insert_one(quote_doc)
    del quote_doc["_id"]
    return quote_doc

@api_router.put("/quotes/{quote_id}/status")
async def update_quote_status(quote_id: str, status: str, current_user: dict = Depends(get_auth_user)):
    valid_statuses = ["draft", "sent", "accepted", "rejected"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Geçersiz durum")
    
    result = await db.quotes.update_one(
        {"id": quote_id, "user_id": current_user["id"]},
        {"$set": {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Teklif bulunamadı")
    
    return {"message": "Durum güncellendi"}

@api_router.delete("/quotes/{quote_id}")
async def delete_quote(quote_id: str, current_user: dict = Depends(get_auth_user)):
    result = await db.quotes.delete_one({"id": quote_id, "user_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Teklif bulunamadı")
    return {"message": "Teklif silindi"}

# ============== PDF GENERATION ==============

@api_router.get("/quotes/{quote_id}/pdf")
async def generate_quote_pdf(quote_id: str, current_user: dict = Depends(get_auth_user)):
    quote = await db.quotes.find_one({"id": quote_id, "user_id": current_user["id"]}, {"_id": 0})
    if not quote:
        raise HTTPException(status_code=404, detail="Teklif bulunamadı")
    
    user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0, "password": 0})
    
    # Format dates
    created_date = datetime.fromisoformat(quote["created_at"].replace("Z", "+00:00")).strftime("%d.%m.%Y")
    validity_date = datetime.fromisoformat(quote["validity_date"].replace("Z", "+00:00")).strftime("%d.%m.%Y")
    
    # Format currency
    def format_currency(amount):
        return f"₺{amount:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    
    # Generate items HTML
    items_html = ""
    for idx, item in enumerate(quote["items"], 1):
        discount_str = f"-{item['discount_percent']}%" if item["discount_percent"] > 0 else "-"
        items_html += f"""
        <tr>
            <td>{idx}</td>
            <td>{item['product_name']}</td>
            <td class="number">{item['quantity']} {item['unit']}</td>
            <td class="number">{format_currency(item['unit_price'])}</td>
            <td class="number">{discount_str}</td>
            <td class="number">%{int(item['vat_rate'])}</td>
            <td class="number">{format_currency(item['total'])}</td>
        </tr>
        """
    
    # Generate bank accounts HTML
    bank_html = ""
    if quote.get("bank_accounts"):
        bank_html = '<div class="bank-section"><h3>Ödeme Bilgileri</h3><div class="bank-grid">'
        for account in quote["bank_accounts"]:
            bank_html += f"""
            <div class="bank-card">
                <div class="bank-name">{account['bank_name']}</div>
                <div class="iban">{account['iban']}</div>
                {f'<div class="holder">{account["account_holder"]}</div>' if account.get('account_holder') else ''}
            </div>
            """
        bank_html += '</div></div>'
    
    # Company logo
    logo_html = ""
    if user.get("company_logo"):
        logo_html = f'<img src="{user["company_logo"]}" class="logo" alt="Logo" />'
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@500;600;700&display=swap');
            
            * {{ margin: 0; padding: 0; box-sizing: border-box; }}
            
            body {{
                font-family: 'Inter', sans-serif;
                font-size: 10pt;
                color: #0F172A;
                line-height: 1.5;
                background: #fff;
            }}
            
            .container {{
                max-width: 800px;
                margin: 0 auto;
                padding: 40px;
            }}
            
            .header {{
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 40px;
                padding-bottom: 20px;
                border-bottom: 2px solid #F97316;
            }}
            
            .logo {{ max-height: 60px; max-width: 200px; }}
            
            .company-info {{
                text-align: left;
            }}
            
            .company-name {{
                font-family: 'Plus Jakarta Sans', sans-serif;
                font-size: 18pt;
                font-weight: 700;
                color: #0F172A;
                margin-bottom: 5px;
            }}
            
            .company-details {{
                font-size: 9pt;
                color: #64748B;
            }}
            
            .quote-info {{
                text-align: right;
            }}
            
            .quote-number {{
                font-family: 'JetBrains Mono', monospace;
                font-size: 14pt;
                font-weight: 600;
                color: #F97316;
                margin-bottom: 10px;
            }}
            
            .quote-meta {{
                font-size: 9pt;
                color: #64748B;
            }}
            
            .quote-meta strong {{
                color: #0F172A;
            }}
            
            .section {{
                margin-bottom: 30px;
            }}
            
            .section-title {{
                font-family: 'Plus Jakarta Sans', sans-serif;
                font-size: 11pt;
                font-weight: 600;
                color: #0F172A;
                margin-bottom: 10px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }}
            
            .customer-box {{
                background: #F8FAFC;
                padding: 15px;
                border-radius: 6px;
                border-left: 3px solid #F97316;
            }}
            
            .customer-name {{
                font-weight: 600;
                font-size: 11pt;
                margin-bottom: 5px;
            }}
            
            .customer-details {{
                font-size: 9pt;
                color: #64748B;
            }}
            
            table {{
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
            }}
            
            th {{
                background: #0F172A;
                color: #fff;
                padding: 12px 10px;
                text-align: left;
                font-size: 9pt;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.3px;
            }}
            
            th:first-child {{ border-radius: 6px 0 0 0; }}
            th:last-child {{ border-radius: 0 6px 0 0; }}
            
            td {{
                padding: 12px 10px;
                border-bottom: 1px solid #E2E8F0;
                font-size: 9pt;
            }}
            
            tr:hover td {{ background: #F8FAFC; }}
            
            .number {{
                font-family: 'JetBrains Mono', monospace;
                text-align: right;
            }}
            
            .totals {{
                margin-left: auto;
                width: 300px;
            }}
            
            .total-row {{
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                border-bottom: 1px solid #E2E8F0;
            }}
            
            .total-row.grand {{
                border-top: 2px solid #0F172A;
                border-bottom: none;
                margin-top: 10px;
                padding-top: 15px;
            }}
            
            .total-label {{
                font-weight: 500;
            }}
            
            .total-value {{
                font-family: 'JetBrains Mono', monospace;
                font-weight: 600;
            }}
            
            .grand .total-label {{
                font-size: 12pt;
                font-weight: 700;
            }}
            
            .grand .total-value {{
                font-size: 14pt;
                color: #F97316;
            }}
            
            .bank-section {{
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #E2E8F0;
            }}
            
            .bank-section h3 {{
                font-family: 'Plus Jakarta Sans', sans-serif;
                font-size: 11pt;
                font-weight: 600;
                margin-bottom: 15px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }}
            
            .bank-grid {{
                display: flex;
                gap: 15px;
                flex-wrap: wrap;
            }}
            
            .bank-card {{
                background: #F8FAFC;
                padding: 15px;
                border-radius: 6px;
                border: 1px solid #E2E8F0;
                min-width: 200px;
            }}
            
            .bank-name {{
                font-weight: 600;
                margin-bottom: 5px;
            }}
            
            .iban {{
                font-family: 'JetBrains Mono', monospace;
                font-size: 10pt;
                color: #0F172A;
            }}
            
            .holder {{
                font-size: 9pt;
                color: #64748B;
                margin-top: 5px;
            }}
            
            .notes {{
                margin-top: 30px;
                padding: 15px;
                background: #FFFBEB;
                border-radius: 6px;
                border-left: 3px solid #F59E0B;
            }}
            
            .notes-title {{
                font-weight: 600;
                margin-bottom: 5px;
            }}
            
            .footer {{
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #E2E8F0;
                text-align: center;
                font-size: 8pt;
                color: #94A3B8;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="company-info">
                    {logo_html}
                    <div class="company-name">{user.get('company_name', '')}</div>
                    <div class="company-details">
                        {user.get('company_address', '') or ''}<br>
                        {user.get('company_phone', '') or ''}<br>
                        {f"VKN: {user.get('company_tax_number')}" if user.get('company_tax_number') else ''}
                    </div>
                </div>
                <div class="quote-info">
                    <div class="quote-number">{quote['quote_number']}</div>
                    <div class="quote-meta">
                        <strong>Tarih:</strong> {created_date}<br>
                        <strong>Geçerlilik:</strong> {validity_date}
                    </div>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">Müşteri Bilgileri</div>
                <div class="customer-box">
                    <div class="customer-name">{quote['customer_name']}</div>
                    <div class="customer-details">
                        {quote.get('customer_address', '') or ''}<br>
                        {quote.get('customer_phone', '') or ''}<br>
                        {quote.get('customer_email', '') or ''}
                    </div>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">Teklif Detayları</div>
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Ürün/Hizmet</th>
                            <th>Miktar</th>
                            <th>Birim Fiyat</th>
                            <th>İskonto</th>
                            <th>KDV</th>
                            <th>Toplam</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items_html}
                    </tbody>
                </table>
                
                <div class="totals">
                    <div class="total-row">
                        <span class="total-label">Ara Toplam</span>
                        <span class="total-value">{format_currency(quote['subtotal'])}</span>
                    </div>
                    <div class="total-row">
                        <span class="total-label">KDV Toplamı</span>
                        <span class="total-value">{format_currency(quote['total_vat'])}</span>
                    </div>
                    <div class="total-row grand">
                        <span class="total-label">GENEL TOPLAM</span>
                        <span class="total-value">{format_currency(quote['total'])}</span>
                    </div>
                </div>
            </div>
            
            {bank_html}
            
            {f'<div class="notes"><div class="notes-title">Notlar</div>{quote["notes"]}</div>' if quote.get('notes') else ''}
            
            <div class="footer">
                Bu teklif {validity_date} tarihine kadar geçerlidir. | QuoteMaster Pro ile oluşturuldu.
            </div>
        </div>
    </body>
    </html>
    """
    
    # Generate PDF
    pdf_buffer = BytesIO()
    HTML(string=html_content).write_pdf(pdf_buffer)
    pdf_buffer.seek(0)
    
    filename = f"Teklif_{quote['quote_number']}_{quote['customer_name'].replace(' ', '_')}.pdf"
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

# ============== DASHBOARD STATS ==============

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_auth_user)):
    total_products = await db.products.count_documents({"user_id": current_user["id"]})
    total_quotes = await db.quotes.count_documents({"user_id": current_user["id"]})
    
    # This month's quotes
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    monthly_quotes = await db.quotes.find({
        "user_id": current_user["id"],
        "created_at": {"$gte": month_start.isoformat()}
    }, {"_id": 0, "total": 1}).to_list(1000)
    
    monthly_total = sum(q.get("total", 0) for q in monthly_quotes)
    
    # Status counts
    status_counts = {
        "draft": await db.quotes.count_documents({"user_id": current_user["id"], "status": "draft"}),
        "sent": await db.quotes.count_documents({"user_id": current_user["id"], "status": "sent"}),
        "accepted": await db.quotes.count_documents({"user_id": current_user["id"], "status": "accepted"}),
        "rejected": await db.quotes.count_documents({"user_id": current_user["id"], "status": "rejected"})
    }
    
    # Recent quotes
    recent_quotes = await db.quotes.find(
        {"user_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).limit(5).to_list(5)
    
    return {
        "total_products": total_products,
        "total_quotes": total_quotes,
        "monthly_total": round(monthly_total, 2),
        "monthly_quote_count": len(monthly_quotes),
        "status_counts": status_counts,
        "recent_quotes": recent_quotes
    }

# ============== SUBSCRIPTION (MOCK IYZICO) ==============

@api_router.get("/subscription/status")
async def get_subscription_status(current_user: dict = Depends(get_auth_user)):
    user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0})
    
    trial_end = datetime.fromisoformat(user["trial_end_date"].replace("Z", "+00:00")) if user.get("trial_end_date") else None
    is_trial_active = trial_end and trial_end > datetime.now(timezone.utc) if trial_end else False
    
    subscription = await db.subscriptions.find_one({"user_id": current_user["id"]}, {"_id": 0})
    
    return {
        "status": user.get("subscription_status", "trial"),
        "trial_end_date": user.get("trial_end_date"),
        "is_trial_active": is_trial_active,
        "subscription": subscription,
        "plan": {
            "name": "Pro",
            "price": 100,
            "currency": "TRY",
            "period": "monthly"
        }
    }

@api_router.post("/subscription/subscribe")
async def create_subscription(card_data: SubscriptionCreate, current_user: dict = Depends(get_auth_user)):
    # Mock Iyzico subscription - In production, integrate with real Iyzico API
    now = datetime.now(timezone.utc)
    next_payment = now + timedelta(days=30)
    
    subscription_doc = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "iyzico_subscription_id": f"MOCK-{str(uuid.uuid4())[:8]}",
        "card_last_four": card_data.card_number[-4:],
        "card_holder": card_data.card_holder_name,
        "status": "active",
        "plan_name": "Pro",
        "amount": 100,
        "currency": "TRY",
        "period": "monthly",
        "next_payment_date": next_payment.isoformat(),
        "created_at": now.isoformat()
    }
    
    await db.subscriptions.insert_one(subscription_doc)
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"subscription_status": "active"}}
    )
    
    del subscription_doc["_id"]
    return {"message": "Abonelik başarıyla oluşturuldu", "subscription": subscription_doc}

@api_router.post("/subscription/cancel")
async def cancel_subscription(current_user: dict = Depends(get_auth_user)):
    result = await db.subscriptions.update_one(
        {"user_id": current_user["id"], "status": "active"},
        {"$set": {"status": "cancelled"}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Aktif abonelik bulunamadı")
    
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"subscription_status": "cancelled"}}
    )
    
    return {"message": "Abonelik iptal edildi"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
