import React, { useState, useEffect } from 'react';
import { bankAccountsAPI } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Skeleton } from '../components/ui/skeleton';
import { toast } from 'sonner';
import { Plus, Trash2, CreditCard, Loader2, Building, DollarSign } from 'lucide-react';

const CURRENCIES = [
  { value: 'TRY', label: '₺ Türk Lirası', symbol: '₺' },
  { value: 'USD', label: '$ Amerikan Doları', symbol: '$' },
  { value: 'EUR', label: '€ Euro', symbol: '€' },
  { value: 'GBP', label: '£ İngiliz Sterlini', symbol: '£' },
];

const ACCOUNT_TYPES = [
  { value: 'checking', label: 'Vadesiz Hesap' },
  { value: 'savings', label: 'Vadeli Hesap' },
  { value: 'foreign', label: 'Döviz Hesabı' },
];

const BankAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    bank_name: '',
    iban: '',
    account_holder: '',
    currency: 'TRY',
    account_type: 'checking',
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await bankAccountsAPI.getAll();
      setAccounts(response.data);
    } catch (error) {
      toast.error('Banka hesapları yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const formatIBAN = (value, isTR = true) => {
    let cleaned = value.replace(/\s/g, '').toUpperCase();
    // TR hesaplarda otomatik TR prefix
    if (isTR && !cleaned.startsWith('TR') && cleaned.length > 0) {
      // Sadece rakam girildiyse başa TR ekle
      if (/^\d/.test(cleaned)) {
        cleaned = 'TR' + cleaned;
      }
    }
    const parts = cleaned.match(/.{1,4}/g) || [];
    return parts.join(' ');
  };

  const handleIBANChange = (e) => {
    const isTR = formData.currency === 'TRY';
    const maxLength = isTR ? 26 : 34; // IBAN max 34 karakter
    const formatted = formatIBAN(e.target.value, isTR);
    if (formatted.replace(/\s/g, '').length <= maxLength) {
      setFormData({ ...formData, iban: formatted });
    }
  };

  const handleCurrencyChange = (value) => {
    setFormData({ 
      ...formData, 
      currency: value,
      iban: value === 'TRY' ? 'TR' : '',
      account_type: value !== 'TRY' ? 'foreign' : 'checking'
    });
  };

  const openDialog = () => {
    setFormData({
      bank_name: '',
      iban: 'TR',
      account_holder: '',
      currency: 'TRY',
      account_type: 'checking',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.bank_name || !formData.iban) {
      toast.error('Banka adı ve IBAN zorunludur');
      return;
    }

    const cleanIBAN = formData.iban.replace(/\s/g, '');
    
    // TR IBAN validasyonu
    if (formData.currency === 'TRY') {
      if (cleanIBAN.length !== 26 || !cleanIBAN.startsWith('TR')) {
        toast.error('Geçerli bir TR IBAN giriniz (26 karakter)');
        return;
      }
    } else {
      // Döviz hesapları için minimum IBAN uzunluğu
      if (cleanIBAN.length < 15) {
        toast.error('Geçerli bir IBAN giriniz');
        return;
      }
    }

    setSaving(true);
    try {
      await bankAccountsAPI.create({
        ...formData,
        iban: cleanIBAN,
      });
      toast.success('Banka hesabı eklendi');
      setDialogOpen(false);
      fetchAccounts();
    } catch (error) {
      toast.error('İşlem başarısız');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (account) => {
    if (!window.confirm(`"${account.bank_name}" hesabını silmek istediğinize emin misiniz?`)) {
      return;
    }

    try {
      await bankAccountsAPI.delete(account.id);
      toast.success('Banka hesabı silindi');
      fetchAccounts();
    } catch (error) {
      toast.error('Hesap silinemedi');
    }
  };

  const displayIBAN = (iban) => {
    const parts = iban.match(/.{1,4}/g) || [];
    return parts.join(' ');
  };

  if (loading) {
    return (
      <div className="space-y-6" data-testid="bank-accounts-loading">
        <div className="flex justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="bank-accounts-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Banka Hesapları</h1>
          <p className="text-slate-500">Teklif PDF'lerinizde görünecek IBAN bilgileri</p>
        </div>
        <Button className="btn-accent" onClick={openDialog} data-testid="add-bank-btn">
          <Plus className="w-4 h-4 mr-2" />
          Hesap Ekle
        </Button>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4 flex items-start gap-3">
          <CreditCard className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm text-blue-800 font-medium">Nasıl Kullanılır?</p>
            <p className="text-sm text-blue-700">
              Teklif oluştururken hangi banka hesaplarının PDF'te görüneceğini seçebilirsiniz.
              TL ve döviz hesapları ekleyebilirsiniz.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Accounts Grid */}
      {accounts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500 mb-4">Henüz banka hesabı eklenmedi</p>
            <Button onClick={openDialog} data-testid="add-first-bank-btn">
              <Plus className="w-4 h-4 mr-2" />
              İlk Hesabınızı Ekleyin
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {accounts.map((account) => {
            const currency = CURRENCIES.find(c => c.value === account.currency) || CURRENCIES[0];
            const accountType = ACCOUNT_TYPES.find(t => t.value === account.account_type);
            return (
              <Card key={account.id} className="card-hover" data-testid={`bank-card-${account.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        account.currency === 'TRY' ? 'bg-slate-100' : 'bg-emerald-100'
                      }`}>
                        {account.currency === 'TRY' ? (
                          <Building className="w-5 h-5 text-slate-600" />
                        ) : (
                          <DollarSign className="w-5 h-5 text-emerald-600" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{account.bank_name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            account.currency === 'TRY' 
                              ? 'bg-slate-100 text-slate-600' 
                              : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {currency.symbol} {currency.label.split(' ')[1] || currency.value}
                          </span>
                          {accountType && (
                            <span className="text-xs text-slate-400">{accountType.label}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(account)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      data-testid={`delete-bank-${account.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-1">IBAN</p>
                    <p className="font-mono text-sm text-slate-900 tracking-wider">
                      {displayIBAN(account.iban)}
                    </p>
                  </div>
                  {account.account_holder && (
                    <p className="text-sm text-slate-500 mt-2">
                      Hesap Sahibi: {account.account_holder}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Bank Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md" data-testid="bank-dialog">
          <DialogHeader>
            <DialogTitle>Banka Hesabı Ekle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="currency">Para Birimi</Label>
                <Select
                  value={formData.currency}
                  onValueChange={handleCurrencyChange}
                >
                  <SelectTrigger data-testid="bank-currency-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="account_type">Hesap Türü</Label>
                <Select
                  value={formData.account_type}
                  onValueChange={(value) => setFormData({ ...formData, account_type: value })}
                >
                  <SelectTrigger data-testid="bank-type-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="bank_name">Banka Adı *</Label>
              <Input
                id="bank_name"
                value={formData.bank_name}
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                placeholder="Örn: Ziraat Bankası"
                data-testid="bank-name-input"
              />
            </div>
            <div>
              <Label htmlFor="iban">IBAN *</Label>
              <Input
                id="iban"
                value={formData.iban}
                onChange={handleIBANChange}
                placeholder={formData.currency === 'TRY' ? 'TR00 0000 0000 0000 0000 0000 00' : 'IBAN numarası'}
                className="font-mono tracking-wider"
                data-testid="bank-iban-input"
              />
              <p className="text-xs text-slate-400 mt-1">
                {formData.currency === 'TRY' 
                  ? '26 haneli TR IBAN numarası (TR otomatik eklenir)' 
                  : 'Uluslararası IBAN numarası'}
              </p>
            </div>
            <div>
              <Label htmlFor="account_holder">Hesap Sahibi</Label>
              <Input
                id="account_holder"
                value={formData.account_holder}
                onChange={(e) => setFormData({ ...formData, account_holder: e.target.value })}
                placeholder="Şirket veya kişi adı (opsiyonel)"
                data-testid="bank-holder-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleSave} disabled={saving} className="btn-accent" data-testid="save-bank-btn">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                'Ekle'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BankAccounts;
