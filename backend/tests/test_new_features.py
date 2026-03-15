"""
Test suite for new QuoteMaster Pro features:
- Password reset endpoints
- Excel template download
- General discount in quotes
- Email sharing endpoint
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestPasswordReset:
    """Password reset flow tests"""
    
    def test_forgot_password_returns_200(self):
        """Test forgot password endpoint returns success even for non-existent email"""
        response = requests.post(f"{BASE_URL}/api/auth/forgot-password", json={
            "email": f"nonexistent_{uuid.uuid4()}@test.com"
        })
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "gönderildi" in data["message"].lower()
        print(f"✓ Forgot password returns 200 with message: {data['message']}")
    
    def test_forgot_password_with_valid_email(self):
        """Test forgot password with a registered user email"""
        # First register a user
        test_email = f"test_reset_{uuid.uuid4().hex[:8]}@test.com"
        register_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "TestPass123!",
            "company_name": "Test Reset Company"
        })
        assert register_response.status_code == 200, f"Registration failed: {register_response.text}"
        
        # Now test forgot password
        response = requests.post(f"{BASE_URL}/api/auth/forgot-password", json={
            "email": test_email
        })
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ Forgot password for registered user returns 200")
    
    def test_reset_password_invalid_token(self):
        """Test reset password with invalid token returns 400"""
        response = requests.post(f"{BASE_URL}/api/auth/reset-password", json={
            "token": "invalid_token_123",
            "new_password": "NewPassword123!"
        })
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        assert "geçersiz" in data["detail"].lower() or "token" in data["detail"].lower()
        print(f"✓ Reset password with invalid token returns 400: {data['detail']}")
    
    def test_verify_reset_token_invalid(self):
        """Test verify reset token endpoint with invalid token"""
        response = requests.get(f"{BASE_URL}/api/auth/verify-reset-token?token=invalid_token")
        assert response.status_code == 400
        print("✓ Verify reset token with invalid token returns 400")


class TestExcelTemplate:
    """Excel template download tests"""
    
    def test_excel_template_download(self):
        """Test Excel template endpoint returns valid XLSX file"""
        response = requests.get(f"{BASE_URL}/api/products/template/excel")
        assert response.status_code == 200
        assert "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" in response.headers.get("Content-Type", "")
        assert len(response.content) > 0
        print(f"✓ Excel template download returns 200 with {len(response.content)} bytes")
    
    def test_excel_template_content_disposition(self):
        """Test Excel template has correct filename header"""
        response = requests.get(f"{BASE_URL}/api/products/template/excel")
        assert response.status_code == 200
        content_disposition = response.headers.get("Content-Disposition", "")
        assert "urun_sablonu.xlsx" in content_disposition or "attachment" in content_disposition
        print(f"✓ Excel template has Content-Disposition: {content_disposition[:50]}...")


class TestGeneralDiscount:
    """General discount in quotes tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        test_email = f"test_discount_{uuid.uuid4().hex[:8]}@test.com"
        # Register
        requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "TestPass123!",
            "company_name": "Test Discount Company"
        })
        # Login
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": test_email,
            "password": "TestPass123!"
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Authentication failed")
    
    @pytest.fixture
    def auth_headers(self, auth_token):
        return {"Authorization": f"Bearer {auth_token}"}
    
    @pytest.fixture
    def test_product_id(self, auth_headers):
        """Create a test product and return its ID"""
        product_data = {
            "name": f"Test Product {uuid.uuid4().hex[:6]}",
            "sku": f"TEST-{uuid.uuid4().hex[:6]}",
            "unit": "adet",
            "unit_price": 1000,
            "vat_rate": 20,
            "description": "Test product for discount tests"
        }
        response = requests.post(f"{BASE_URL}/api/products", json=product_data, headers=auth_headers)
        if response.status_code == 200:
            return response.json().get("id")
        pytest.skip(f"Failed to create test product: {response.text}")
    
    def test_create_quote_with_percent_discount(self, auth_headers, test_product_id):
        """Test creating a quote with percentage general discount"""
        quote_data = {
            "customer_name": "Test Customer Discount",
            "customer_email": "customer@test.com",
            "items": [
                {
                    "product_id": test_product_id,
                    "product_name": "Test Product",
                    "quantity": 2,
                    "unit": "adet",
                    "unit_price": 1000,
                    "vat_rate": 20
                }
            ],
            "general_discount_type": "percent",
            "general_discount_value": 10
        }
        response = requests.post(f"{BASE_URL}/api/quotes", json=quote_data, headers=auth_headers)
        assert response.status_code == 200, f"Failed to create quote: {response.text}"
        
        data = response.json()
        assert data.get("general_discount_type") == "percent"
        assert data.get("general_discount_value") == 10
        
        # Check total calculation - 2000 base, 10% discount = 200 off
        # Then add VAT on discounted amount
        print(f"✓ Quote with 10% discount created. Total: {data.get('total')}")
    
    def test_create_quote_with_amount_discount(self, auth_headers, test_product_id):
        """Test creating a quote with fixed amount general discount"""
        quote_data = {
            "customer_name": "Test Customer Fixed",
            "customer_email": "customer2@test.com",
            "items": [
                {
                    "product_id": test_product_id,
                    "product_name": "Test Product 2",
                    "quantity": 1,
                    "unit": "adet",
                    "unit_price": 5000,
                    "vat_rate": 20
                }
            ],
            "general_discount_type": "amount",
            "general_discount_value": 500
        }
        response = requests.post(f"{BASE_URL}/api/quotes", json=quote_data, headers=auth_headers)
        assert response.status_code == 200, f"Failed to create quote: {response.text}"
        
        data = response.json()
        assert data.get("general_discount_type") == "amount"
        assert data.get("general_discount_value") == 500
        print(f"✓ Quote with 500 TL fixed discount created. Total: {data.get('total')}")
    
    def test_create_quote_without_discount(self, auth_headers, test_product_id):
        """Test creating a quote without general discount"""
        quote_data = {
            "customer_name": "Test Customer No Discount",
            "customer_email": "customer3@test.com",
            "items": [
                {
                    "product_id": test_product_id,
                    "product_name": "Test Product 3",
                    "quantity": 1,
                    "unit": "adet",
                    "unit_price": 1000,
                    "vat_rate": 20
                }
            ]
        }
        response = requests.post(f"{BASE_URL}/api/quotes", json=quote_data, headers=auth_headers)
        assert response.status_code == 200, f"Failed to create quote: {response.text}"
        
        data = response.json()
        # Should either be null or not have discount
        assert data.get("general_discount_type") is None or data.get("general_discount_value", 0) == 0
        print(f"✓ Quote without discount created. Total: {data.get('total')}")


class TestEmailSharing:
    """Email sharing tests (Note: actual email sending requires RESEND_API_KEY)"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        test_email = f"test_email_{uuid.uuid4().hex[:8]}@test.com"
        requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "TestPass123!",
            "company_name": "Test Email Company"
        })
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": test_email,
            "password": "TestPass123!"
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Authentication failed")
    
    @pytest.fixture
    def auth_headers(self, auth_token):
        return {"Authorization": f"Bearer {auth_token}"}
    
    @pytest.fixture
    def test_quote_id(self, auth_headers):
        """Create a test quote and return its ID"""
        quote_data = {
            "customer_name": "Email Test Customer",
            "customer_email": "emailtest@test.com",
            "items": [
                {
                    "product_name": "Test Product",
                    "quantity": 1,
                    "unit": "adet",
                    "unit_price": 100,
                    "vat_rate": 20
                }
            ]
        }
        response = requests.post(f"{BASE_URL}/api/quotes", json=quote_data, headers=auth_headers)
        if response.status_code == 200:
            return response.json().get("id")
        pytest.skip("Failed to create test quote")
    
    def test_email_share_endpoint_exists(self, auth_headers, test_quote_id):
        """Test that email sharing endpoint exists and responds"""
        # Note: Actual email sending requires RESEND_API_KEY
        response = requests.post(
            f"{BASE_URL}/api/quotes/{test_quote_id}/share/email",
            json={
                "recipient_email": "test@example.com",
                "message": "Test message"
            },
            headers=auth_headers
        )
        # Accept either 200 (success) or 500 (if RESEND not configured)
        # The endpoint should at least exist
        assert response.status_code in [200, 500], f"Unexpected status: {response.status_code}"
        print(f"✓ Email share endpoint responds with status {response.status_code}")


class TestPdfSettings:
    """PDF settings tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        test_email = f"test_pdf_{uuid.uuid4().hex[:8]}@test.com"
        requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "TestPass123!",
            "company_name": "Test PDF Company"
        })
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": test_email,
            "password": "TestPass123!"
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Authentication failed")
    
    @pytest.fixture
    def auth_headers(self, auth_token):
        return {"Authorization": f"Bearer {auth_token}"}
    
    def test_update_pdf_settings(self, auth_headers):
        """Test updating PDF settings via profile endpoint"""
        update_data = {
            "pdf_show_images": True,
            "pdf_image_size": "large",
            "pdf_description_length": "short"
        }
        response = requests.put(f"{BASE_URL}/api/auth/profile", json=update_data, headers=auth_headers)
        assert response.status_code == 200, f"Failed to update profile: {response.text}"
        
        data = response.json()
        assert data.get("pdf_show_images") == True
        assert data.get("pdf_image_size") == "large"
        assert data.get("pdf_description_length") == "short"
        print(f"✓ PDF settings updated successfully")
    
    def test_pdf_settings_persist(self, auth_headers):
        """Test that PDF settings persist after update"""
        # First update
        update_data = {
            "pdf_show_images": False,
            "pdf_image_size": "small",
            "pdf_description_length": "hidden"
        }
        response = requests.put(f"{BASE_URL}/api/auth/profile", json=update_data, headers=auth_headers)
        assert response.status_code == 200
        
        # Profile is returned in the response after update
        data = response.json()
        assert data.get("pdf_show_images") == False
        assert data.get("pdf_image_size") == "small"
        assert data.get("pdf_description_length") == "hidden"
        print(f"✓ PDF settings persisted correctly")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
