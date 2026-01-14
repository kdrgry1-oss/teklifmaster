import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import { Building2, Mail, Phone, MapPin, Upload, Loader2, Save, Image } from 'lucide-react';

const Settings = () => {
  const { user, updateUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    company_name: user?.company_name || '',
    company_address: user?.company_address || '',
    company_phone: user?.company_phone || '',
    company_tax_number: user?.company_tax_number || '',
  });

  const handleSave = async () => {
    if (!formData.company_name) {
      toast.error('Şirket adı zorunludur');
      return;
    }

    setSaving(true);
    try {
      const response = await authAPI.updateProfile(formData);
      updateUser(response.data);
      toast.success('Ayarlar kaydedildi');
    } catch (error) {
      toast.error('Ayarlar kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo dosyası 2MB\'dan küçük olmalıdır');
      return;
    }

    setUploadingLogo(true);
    try {
      const response = await authAPI.uploadLogo(file);
      updateUser({ ...user, company_logo: response.data.logo_url });
      toast.success('Logo yüklendi');
    } catch (error) {
      toast.error('Logo yüklenemedi');
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in" data-testid="settings-page">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Ayarlar</h1>
        <p className="text-slate-500">Şirket bilgilerinizi ve logonuzu yönetin</p>
      </div>

      {/* Logo Section */}
      <Card data-testid="logo-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Image className="w-5 h-5" />
            Şirket Logosu
          </CardTitle>
          <CardDescription>
            Logonuz teklif PDF'lerinin başlığında görünecektir
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="w-32 h-32 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden border-2 border-dashed border-slate-200">
              {user?.company_logo ? (
                <img
                  src={user.company_logo}
                  alt="Şirket Logosu"
                  className="w-full h-full object-contain"
                />
              ) : (
                <Building2 className="w-12 h-12 text-slate-300" />
              )}
            </div>
            <div>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingLogo}
                data-testid="upload-logo-btn"
              >
                {uploadingLogo ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Yükleniyor...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Logo Yükle
                  </>
                )}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
              <p className="text-xs text-slate-400 mt-2">PNG, JPG veya SVG. Max 2MB</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Company Info */}
      <Card data-testid="company-info-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Şirket Bilgileri
          </CardTitle>
          <CardDescription>
            Bu bilgiler teklif PDF'lerinde görünecektir
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="company_name">Şirket Adı *</Label>
            <Input
              id="company_name"
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              placeholder="Şirket adınız"
              data-testid="company-name-input"
            />
          </div>

          <div>
            <Label htmlFor="company_address">Adres</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <Textarea
                id="company_address"
                value={formData.company_address}
                onChange={(e) => setFormData({ ...formData, company_address: e.target.value })}
                className="pl-10 min-h-[80px]"
                placeholder="Şirket adresi"
                data-testid="company-address-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="company_phone">Telefon</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="company_phone"
                  value={formData.company_phone}
                  onChange={(e) => setFormData({ ...formData, company_phone: e.target.value })}
                  className="pl-10"
                  placeholder="0212 000 00 00"
                  data-testid="company-phone-input"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="company_tax_number">Vergi Numarası</Label>
              <Input
                id="company_tax_number"
                value={formData.company_tax_number}
                onChange={(e) => setFormData({ ...formData, company_tax_number: e.target.value })}
                placeholder="0000000000"
                className="font-mono"
                data-testid="company-tax-input"
              />
            </div>
          </div>

          <div className="pt-4">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="btn-accent"
              data-testid="save-settings-btn"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Değişiklikleri Kaydet
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card data-testid="account-info-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Hesap Bilgileri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg">
              {user?.company_name?.charAt(0) || 'U'}
            </div>
            <div>
              <p className="font-medium">{user?.email}</p>
              <p className="text-sm text-slate-500">
                Kayıt tarihi: {new Date(user?.created_at).toLocaleDateString('tr-TR')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
