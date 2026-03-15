import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import { Building2, Mail, Phone, MapPin, Upload, Loader2, Save, Image, FileText, Check } from 'lucide-react';

const PDF_TEMPLATES = [
  {
    id: 'classic',
    name: 'Klasik',
    description: 'Minimalist ve kurumsal',
    primary: '#0F172A',
    accent: '#F97316',
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Canlı ve dinamik',
    primary: '#7C3AED',
    accent: '#10B981',
  },
  {
    id: 'professional',
    name: 'Profesyonel',
    description: 'Ciddi ve resmi',
    primary: '#1F2937',
    accent: '#1F2937',
  },
  {
    id: 'elegant',
    name: 'Zarif',
    description: 'Sıcak ve şık',
    primary: '#78350F',
    accent: '#B45309',
  },
  {
    id: 'ocean',
    name: 'Okyanus',
    description: 'Ferah ve güvenilir',
    primary: '#0369A1',
    accent: '#0891B2',
  },
];

const Settings = () => {
  const { user, updateUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    company_name: user?.company_name || '',
    company_address: user?.company_address || '',
    company_phone: user?.company_phone || '',
    company_tax_number: user?.company_tax_number || '',
  });

  const [selectedTemplate, setSelectedTemplate] = useState(user?.pdf_template || 'classic');

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

  const handleTemplateSelect = async (templateId) => {
    setSelectedTemplate(templateId);
    setSavingTemplate(true);
    try {
      const response = await authAPI.updateProfile({ pdf_template: templateId });
      updateUser(response.data);
      toast.success('PDF şablonu güncellendi');
    } catch (error) {
      toast.error('Şablon kaydedilemedi');
      setSelectedTemplate(user?.pdf_template || 'classic');
    } finally {
      setSavingTemplate(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in" data-testid="settings-page">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Ayarlar</h1>
        <p className="text-slate-500">Şirket bilgilerinizi ve PDF şablonunuzu yönetin</p>
      </div>

      {/* PDF Template Selection */}
      <Card data-testid="pdf-template-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5" />
            PDF Şablonu
          </CardTitle>
          <CardDescription>
            Teklif PDF'leriniz için varsayılan tasarımı seçin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {PDF_TEMPLATES.map((template) => (
              <div
                key={template.id}
                onClick={() => handleTemplateSelect(template.id)}
                className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all hover:shadow-md ${
                  selectedTemplate === template.id
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
                data-testid={`template-${template.id}`}
              >
                {selectedTemplate === template.id && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
                
                {/* Template Preview */}
                <div className="mb-3 rounded-md overflow-hidden border border-slate-200 bg-white">
                  <div 
                    className="h-2" 
                    style={{ backgroundColor: template.accent }}
                  />
                  <div className="p-2">
                    <div 
                      className="h-2 w-16 rounded mb-1" 
                      style={{ backgroundColor: template.primary }}
                    />
                    <div className="h-1 w-12 bg-slate-200 rounded mb-2" />
                    <div className="space-y-1">
                      <div className="h-1 w-full bg-slate-100 rounded" />
                      <div className="h-1 w-full bg-slate-100 rounded" />
                      <div className="h-1 w-3/4 bg-slate-100 rounded" />
                    </div>
                    <div className="mt-2 flex justify-end">
                      <div 
                        className="h-2 w-8 rounded" 
                        style={{ backgroundColor: template.accent }}
                      />
                    </div>
                  </div>
                </div>
                
                <h3 className="font-semibold text-sm">{template.name}</h3>
                <p className="text-xs text-slate-500">{template.description}</p>
              </div>
            ))}
          </div>
          {savingTemplate && (
            <div className="mt-4 flex items-center gap-2 text-sm text-orange-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              Şablon kaydediliyor...
            </div>
          )}
        </CardContent>
      </Card>

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
