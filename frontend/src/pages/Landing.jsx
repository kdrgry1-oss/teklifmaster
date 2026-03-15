import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { toast } from 'sonner';
import { 
  FileText, Mail, Lock, Building2, Loader2, Check, 
  BarChart3, Users, Package, CreditCard, Share2, 
  FileDown, Shield, Zap, ArrowRight
} from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeTab, setActiveTab] = useState('login');

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      toast.error('Lütfen tüm alanları doldurun');
      return;
    }

    setLoading(true);
    try {
      await login(loginEmail, loginPassword);
      toast.success('Giriş başarılı!');
      setShowAuthModal(false);
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Giriş başarısız');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!registerEmail || !registerPassword || !companyName) {
      toast.error('Lütfen tüm alanları doldurun');
      return;
    }

    if (!termsAccepted) {
      toast.error('Kullanıcı sözleşmesini kabul etmelisiniz');
      return;
    }

    if (registerPassword.length < 6) {
      toast.error('Şifre en az 6 karakter olmalıdır');
      return;
    }

    setLoading(true);
    try {
      await register(registerEmail, registerPassword, companyName);
      toast.success('Kayıt başarılı! 7 günlük deneme süreniz başladı.');
      setShowAuthModal(false);
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Kayıt başarısız');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: Package,
      title: 'Ürün Kataloğu',
      description: 'Ürünlerinizi kolayca yönetin, fiyatlandırın ve kategorize edin.'
    },
    {
      icon: FileText,
      title: 'PDF Teklif Oluşturma',
      description: 'Profesyonel PDF teklifleri saniyeler içinde oluşturun.'
    },
    {
      icon: Users,
      title: 'Müşteri Yönetimi',
      description: 'Müşteri bilgilerinizi kaydedin ve tekliflerinizi takip edin.'
    },
    {
      icon: Share2,
      title: 'Kolay Paylaşım',
      description: 'Tekliflerinizi WhatsApp ve E-posta ile anında paylaşın.'
    },
    {
      icon: BarChart3,
      title: 'Raporlama',
      description: 'Satış performansınızı detaylı raporlarla analiz edin.'
    },
    {
      icon: FileDown,
      title: 'Excel Import/Export',
      description: 'Ürünlerinizi Excel ile toplu olarak içe/dışa aktarın.'
    }
  ];

  const pricingFeatures = [
    'Sınırsız teklif oluşturma',
    'Sınırsız müşteri kaydı',
    'Sınırsız ürün kaydı',
    '5 farklı PDF şablonu',
    'Excel import/export',
    'WhatsApp & E-posta paylaşımı',
    'Detaylı raporlama',
    'Öncelikli destek'
  ];

  return (
    <div className="min-h-screen bg-white" data-testid="landing-page">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">TeklifMaster</span>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => { setActiveTab('login'); setShowAuthModal(true); }}
                data-testid="header-login-btn"
              >
                Giriş Yap
              </Button>
              <Button 
                className="bg-orange-500 hover:bg-orange-600"
                onClick={() => { setActiveTab('register'); setShowAuthModal(true); }}
                data-testid="header-register-btn"
              >
                Ücretsiz Dene
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
                Profesyonel Teklifler,
                <span className="text-orange-500"> Saniyeler İçinde</span>
              </h1>
              <p className="text-lg sm:text-xl text-slate-300 mb-8 max-w-xl mx-auto lg:mx-0">
                TeklifMaster ile ürün kataloglarınızı yönetin, kurumsal PDF teklifleri oluşturun 
                ve müşterilerinizle anında paylaşın.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button 
                  size="lg"
                  className="bg-orange-500 hover:bg-orange-600 text-base sm:text-lg px-6 sm:px-8"
                  onClick={() => { setActiveTab('register'); setShowAuthModal(true); }}
                  data-testid="hero-cta-btn"
                >
                  7 Gün Ücretsiz Dene
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                </Button>
              </div>
              <div className="mt-8 flex items-center justify-center lg:justify-start gap-8">
                <div>
                  <p className="text-3xl font-bold text-orange-400">1000+</p>
                  <p className="text-slate-400 text-sm">Aktif Kullanıcı</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-orange-400">50K+</p>
                  <p className="text-slate-400 text-sm">Oluşturulan Teklif</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-orange-400">%99</p>
                  <p className="text-slate-400 text-sm">Müşteri Memnuniyeti</p>
                </div>
              </div>
            </div>
            <div className="hidden lg:block">
              <img 
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800" 
                alt="Dashboard Preview"
                className="rounded-2xl shadow-2xl border border-slate-700"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50" id="features">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              İşinizi Kolaylaştıran Özellikler
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              TeklifMaster, teklif süreçlerinizi hızlandırmak ve profesyonelleştirmek için 
              ihtiyacınız olan tüm araçları sunar.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-orange-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-slate-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white" id="pricing">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Basit ve Şeffaf Fiyatlandırma
            </h2>
            <p className="text-lg text-slate-600">
              7 gün ücretsiz deneyin, memnun kalmazsanız ödeme yapmayın.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Monthly Plan */}
            <Card className="border-2 border-slate-200 shadow-lg overflow-hidden">
              <div className="bg-slate-100 text-slate-700 text-center py-2 text-sm font-medium">
                AYLIK PLAN
              </div>
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-4xl font-bold text-slate-900">₺299</span>
                    <span className="text-slate-500">/ay</span>
                  </div>
                  <p className="text-slate-600 mt-2">KDV dahil</p>
                </div>
                
                <div className="space-y-3 mb-6">
                  {pricingFeatures.slice(0, 4).map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-green-600" />
                      </div>
                      <span className="text-slate-700 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
                
                <Button 
                  size="lg"
                  variant="outline"
                  className="w-full"
                  onClick={() => { setActiveTab('register'); setShowAuthModal(true); }}
                >
                  Hemen Başla
                </Button>
              </CardContent>
            </Card>

            {/* Yearly Plan */}
            <Card className="border-2 border-orange-500 shadow-xl overflow-hidden relative">
              <div className="absolute top-4 right-4 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
                2 AY BEDAVA
              </div>
              <div className="bg-orange-500 text-white text-center py-2 text-sm font-medium">
                YILLIK PLAN - EN AVANTAJLI
              </div>
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-4xl font-bold text-slate-900">₺2990</span>
                    <span className="text-slate-500">/yıl</span>
                  </div>
                  <p className="text-slate-600 mt-1">
                    <span className="line-through text-slate-400">₺3588</span>
                    <span className="text-green-600 font-medium ml-2">₺598 tasarruf!</span>
                  </p>
                  <p className="text-orange-600 text-sm mt-1">Aylık sadece ₺249</p>
                </div>
                
                <div className="space-y-3 mb-6">
                  {pricingFeatures.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-green-600" />
                      </div>
                      <span className="text-slate-700 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
                
                <Button 
                  size="lg"
                  className="w-full bg-orange-500 hover:bg-orange-600 text-lg"
                  onClick={() => { setActiveTab('register'); setShowAuthModal(true); }}
                  data-testid="pricing-cta-btn"
                >
                  7 Gün Ücretsiz Dene
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                
                <p className="text-center text-sm text-slate-500 mt-4">
                  Kredi kartı gerekmez. İstediğiniz zaman iptal edin.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-8 text-center">
            <div>
              <Shield className="w-12 h-12 text-orange-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Güvenli Altyapı</h3>
              <p className="text-slate-400">Verileriniz SSL şifreleme ile korunur.</p>
            </div>
            <div>
              <Zap className="w-12 h-12 text-orange-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Hızlı ve Güvenilir</h3>
              <p className="text-slate-400">%99.9 uptime garantisi ile kesintisiz hizmet.</p>
            </div>
            <div>
              <CreditCard className="w-12 h-12 text-orange-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Güvenli Ödeme</h3>
              <p className="text-slate-400">Iyzico altyapısı ile güvenli ödeme.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-orange-500 to-orange-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Profesyonel Tekliflere Hemen Başlayın
          </h2>
          <p className="text-lg text-orange-100 mb-8 max-w-2xl mx-auto">
            TeklifMaster ile işletmenizin teklif süreçlerini modernleştirin. 
            7 gün ücretsiz deneyin!
          </p>
          <Button 
            size="lg"
            variant="secondary"
            className="text-lg px-8"
            onClick={() => { setActiveTab('register'); setShowAuthModal(true); }}
            data-testid="footer-cta-btn"
          >
            Ücretsiz Denemeyi Başlat
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 bg-slate-900 border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">TeklifMaster</span>
          </div>
          <p className="text-slate-400 text-sm">
            © 2025 TeklifMaster. Tüm hakları saklıdır.
          </p>
        </div>
      </footer>

      {/* Auth Modal */}
      <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">
              {activeTab === 'login' ? 'Giriş Yap' : 'Hesap Oluştur'}
            </DialogTitle>
          </DialogHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login" data-testid="modal-login-tab">Giriş Yap</TabsTrigger>
              <TabsTrigger value="register" data-testid="modal-register-tab">Kayıt Ol</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="modal-login-email">E-posta</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="modal-login-email"
                      type="email"
                      placeholder="ornek@sirket.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="pl-10"
                      data-testid="modal-login-email"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="modal-login-password">Şifre</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="modal-login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="pl-10"
                      data-testid="modal-login-password"
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-orange-500 hover:bg-orange-600"
                  disabled={loading}
                  data-testid="modal-login-submit"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Giriş yapılıyor...
                    </>
                  ) : (
                    'Giriş Yap'
                  )}
                </Button>
                <div className="text-center">
                  <a 
                    href="/forgot-password" 
                    className="text-sm text-orange-500 hover:underline"
                    data-testid="modal-forgot-password-link"
                  >
                    Şifremi Unuttum
                  </a>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="modal-company-name">Şirket Adı</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="modal-company-name"
                      type="text"
                      placeholder="Şirket Adınız"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="pl-10"
                      data-testid="modal-register-company"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="modal-register-email">E-posta</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="modal-register-email"
                      type="email"
                      placeholder="ornek@sirket.com"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      className="pl-10"
                      data-testid="modal-register-email"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="modal-register-password">Şifre</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="modal-register-password"
                      type="password"
                      placeholder="En az 6 karakter"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      className="pl-10"
                      data-testid="modal-register-password"
                    />
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="terms-checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-1"
                    data-testid="terms-checkbox"
                  />
                  <label htmlFor="terms-checkbox" className="text-xs text-slate-600">
                    <a href="/terms" target="_blank" className="text-orange-500 hover:underline">
                      Kullanıcı Sözleşmesi
                    </a>'ni okudum ve kabul ediyorum. 
                    Oluşturulan tekliflerde "teklifmaster.com" ibaresinin yer alacağını onaylıyorum.
                  </label>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-orange-500 hover:bg-orange-600"
                  disabled={loading || !termsAccepted}
                  data-testid="modal-register-submit"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Kayıt yapılıyor...
                    </>
                  ) : (
                    '7 Gün Ücretsiz Dene'
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Landing;
