import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productsAPI, bankAccountsAPI, quotesAPI, formatCurrency } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Checkbox } from '../components/ui/checkbox';
import { Textarea } from '../components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../components/ui/sheet';
import { Skeleton } from '../components/ui/skeleton';
import { Switch } from '../components/ui/switch';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Package,
  Search,
  FileText,
  Loader2,
  Calendar,
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Percent,
} from 'lucide-react';

const NewQuote = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    customer_address: '',
    validity_days: 30,
    notes: '',
    include_vat: true,
    selectedBanks: [],
  });

  const [items, setItems] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, banksRes] = await Promise.all([
        productsAPI.getAll(),
        bankAccountsAPI.getAll(),
      ]);
      setProducts(productsRes.data);
      setBankAccounts(banksRes.data);
    } catch (error) {
      toast.error('Veriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const addProduct = (product) => {
    const existingIndex = items.findIndex((i) => i.product_id === product.id);
    if (existingIndex >= 0) {
      const newItems = [...items];
      newItems[existingIndex].quantity += 1;
      setItems(newItems);
    } else {
      setItems([
        ...items,
        {
          product_id: product.id,
          product_name: product.name,
          unit: product.unit,
          quantity: 1,
          unit_price: product.unit_price,
          vat_rate: product.vat_rate,
          discount_percent: 0,
        },
      ]);
    }
    setSheetOpen(false);
    setProductSearch('');
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const toggleBank = (bankId) => {
    const selected = formData.selectedBanks.includes(bankId)
      ? formData.selectedBanks.filter((id) => id !== bankId)
      : [...formData.selectedBanks, bankId];
    setFormData({ ...formData, selectedBanks: selected });
  };

  // Calculate totals
  const calculateItem = (item) => {
    const subtotal = item.quantity * item.unit_price;
    const discountAmount = subtotal * (item.discount_percent / 100);
    const afterDiscount = subtotal - discountAmount;
    const vatAmount = formData.include_vat ? afterDiscount * (item.vat_rate / 100) : 0;
    return {
      subtotal: afterDiscount,
      vat: vatAmount,
      total: afterDiscount + vatAmount,
    };
  };

  const totals = items.reduce(
    (acc, item) => {
      const calc = calculateItem(item);
      return {
        subtotal: acc.subtotal + calc.subtotal,
        vat: acc.vat + calc.vat,
        total: acc.total + calc.total,
      };
    },
    { subtotal: 0, vat: 0, total: 0 }
  );

  const handleSubmit = async () => {
    if (!formData.customer_name) {
      toast.error('Müşteri adı zorunludur');
      return;
    }
    if (items.length === 0) {
      toast.error('En az bir ürün ekleyin');
      return;
    }

    setSaving(true);
    try {
      const quoteData = {
        customer_name: formData.customer_name,
        customer_email: formData.customer_email || null,
        customer_phone: formData.customer_phone || null,
        customer_address: formData.customer_address || null,
        validity_days: formData.validity_days,
        notes: formData.notes || null,
        include_vat: formData.include_vat,
        bank_account_ids: formData.selectedBanks,
        items: items.map((item) => ({
          product_id: item.product_id,
          product_name: item.product_name,
          unit: item.unit,
          quantity: parseFloat(item.quantity),
          unit_price: parseFloat(item.unit_price),
          vat_rate: parseFloat(item.vat_rate),
          discount_percent: parseFloat(item.discount_percent) || 0,
        })),
      };

      const response = await quotesAPI.create(quoteData);
      toast.success('Teklif oluşturuldu');
      navigate(`/quotes/${response.data.id}`);
    } catch (error) {
      toast.error('Teklif oluşturulamadı');
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6" data-testid="new-quote-loading">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-60 w-full" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" data-testid="new-quote-page">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate('/quotes')} data-testid="back-btn">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Geri
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Yeni Teklif Oluştur</h1>
          <p className="text-slate-500">Müşteri bilgilerini ve ürünleri ekleyin</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Form */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card data-testid="customer-info-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5" />
                Müşteri Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="customer_name">Müşteri / Firma Adı *</Label>
                <Input
                  id="customer_name"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  placeholder="Müşteri adı"
                  data-testid="customer-name-input"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customer_email">E-posta</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="customer_email"
                      type="email"
                      value={formData.customer_email}
                      onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                      className="pl-10"
                      placeholder="ornek@email.com"
                      data-testid="customer-email-input"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="customer_phone">Telefon</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="customer_phone"
                      value={formData.customer_phone}
                      onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                      className="pl-10"
                      placeholder="0500 000 00 00"
                      data-testid="customer-phone-input"
                    />
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="customer_address">Adres</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <Textarea
                    id="customer_address"
                    value={formData.customer_address}
                    onChange={(e) => setFormData({ ...formData, customer_address: e.target.value })}
                    className="pl-10 min-h-[80px]"
                    placeholder="Müşteri adresi"
                    data-testid="customer-address-input"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quote Items */}
          <Card data-testid="quote-items-card">
            <CardHeader className="pb-4 flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="w-5 h-5" />
                Ürün/Hizmetler ({items.length})
              </CardTitle>
              <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetTrigger asChild>
                  <Button size="sm" className="btn-accent" data-testid="add-item-btn">
                    <Plus className="w-4 h-4 mr-1" />
                    Ürün Ekle
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-[400px] sm:w-[540px]">
                  <SheetHeader>
                    <SheetTitle>Ürün Seç</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4 space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        placeholder="Ürün ara..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="pl-10"
                        data-testid="product-search-sheet"
                      />
                    </div>
                    <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                      {filteredProducts.length === 0 ? (
                        <p className="text-center text-slate-500 py-8">Ürün bulunamadı</p>
                      ) : (
                        filteredProducts.map((product) => (
                          <div
                            key={product.id}
                            className="p-3 border rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                            onClick={() => addProduct(product)}
                            data-testid={`select-product-${product.id}`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{product.name}</p>
                                <p className="text-sm text-slate-500">
                                  {product.unit} • %{product.vat_rate} KDV
                                </p>
                              </div>
                              <p className="font-semibold font-mono">
                                {formatCurrency(product.unit_price)}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Package className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p>Henüz ürün eklenmedi</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item, index) => {
                    const calc = calculateItem(item);
                    return (
                      <div
                        key={index}
                        className="p-4 border rounded-lg bg-slate-50"
                        data-testid={`quote-item-${index}`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-medium">{item.product_name}</p>
                            <p className="text-sm text-slate-500">{item.unit}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(index)}
                            className="text-red-500 hover:text-red-600"
                            data-testid={`remove-item-${index}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-4 gap-3">
                          <div>
                            <Label className="text-xs">Miktar</Label>
                            <Input
                              type="number"
                              min="1"
                              step="0.01"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 1)}
                              className="h-9 text-right font-mono"
                              data-testid={`item-qty-${index}`}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Birim Fiyat</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.unit_price}
                              onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                              className="h-9 text-right font-mono"
                              data-testid={`item-price-${index}`}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">İskonto %</Label>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={item.discount_percent}
                              onChange={(e) => updateItem(index, 'discount_percent', parseFloat(e.target.value) || 0)}
                              className="h-9 text-right font-mono"
                              data-testid={`item-discount-${index}`}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Toplam</Label>
                            <div className="h-9 flex items-center justify-end font-semibold font-mono text-slate-900">
                              {formatCurrency(calc.total)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bank Accounts */}
          {bankAccounts.length > 0 && (
            <Card data-testid="bank-selection-card">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Ödeme Bilgileri
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500 mb-3">
                  PDF'te görünecek banka hesaplarını seçin
                </p>
                <div className="space-y-2">
                  {bankAccounts.map((account) => (
                    <div
                      key={account.id}
                      className="flex items-center gap-3 p-3 border rounded-lg"
                    >
                      <Checkbox
                        checked={formData.selectedBanks.includes(account.id)}
                        onCheckedChange={() => toggleBank(account.id)}
                        data-testid={`bank-checkbox-${account.id}`}
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{account.bank_name}</p>
                        <p className="text-xs text-slate-500 font-mono">{account.iban}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Summary */}
        <div className="lg:sticky lg:top-24 h-fit">
          <Card data-testid="quote-summary-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Teklif Özeti
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Settings */}
              <div className="space-y-4 pb-4 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <Label>Geçerlilik Süresi (Gün)</Label>
                  </div>
                  <Input
                    type="number"
                    min="1"
                    value={formData.validity_days}
                    onChange={(e) =>
                      setFormData({ ...formData, validity_days: parseInt(e.target.value) || 30 })
                    }
                    className="w-20 h-9 text-right font-mono"
                    data-testid="validity-days-input"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-slate-400" />
                    <Label>KDV Dahil</Label>
                  </div>
                  <Switch
                    checked={formData.include_vat}
                    onCheckedChange={(checked) => setFormData({ ...formData, include_vat: checked })}
                    data-testid="include-vat-switch"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label>Notlar</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Teklif için ek notlar..."
                  className="min-h-[80px]"
                  data-testid="quote-notes-input"
                />
              </div>

              {/* Totals */}
              <div className="space-y-2 pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Ara Toplam</span>
                  <span className="font-mono">{formatCurrency(totals.subtotal)}</span>
                </div>
                {formData.include_vat && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">KDV Toplamı</span>
                    <span className="font-mono">{formatCurrency(totals.vat)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Genel Toplam</span>
                  <span className="font-mono text-orange-500">{formatCurrency(totals.total)}</span>
                </div>
              </div>

              {/* Submit */}
              <Button
                className="w-full btn-accent h-12 text-base"
                onClick={handleSubmit}
                disabled={saving || items.length === 0 || !formData.customer_name}
                data-testid="create-quote-submit"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Oluşturuluyor...
                  </>
                ) : (
                  <>
                    <FileText className="w-5 h-5 mr-2" />
                    Teklif Oluştur
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NewQuote;
