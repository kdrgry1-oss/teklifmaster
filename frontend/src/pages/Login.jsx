import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { FileText, Mail, Lock, Building2, Loader2 } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [companyName, setCompanyName] = useState('');

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

    if (registerPassword.length < 6) {
      toast.error('Şifre en az 6 karakter olmalıdır');
      return;
    }

    setLoading(true);
    try {
      await register(registerEmail, registerPassword, companyName);
      toast.success('Kayıt başarılı! 7 günlük deneme süreniz başladı.');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Kayıt başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" data-testid="login-page">
      {/* Left side - Image */}
      <div
        className="hidden lg:flex lg:w-1/2 bg-cover bg-center relative"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1566476927456-446189d7b1ca?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxODd8MHwxfHNlYXJjaHwyfHxtaW5pbWFsaXN0JTIwYnJpZ2h0JTIwb2ZmaWNlJTIwd29ya3NwYWNlfGVufDB8fHx8MTc2ODQyNDkwNnww&ixlib=rb-4.1.0&q=85')`,
        }}
      >
        <div className="absolute inset-0 bg-primary/80" />
        <div className="relative z-10 flex flex-col justify-center p-12 text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
              <FileText className="w-7 h-7" />
            </div>
            <span className="text-2xl font-bold">QuoteMaster Pro</span>
          </div>
          <h1 className="text-4xl font-bold mb-4 leading-tight">
            Profesyonel Teklifler,<br />Saniyeler İçinde
          </h1>
          <p className="text-white/80 text-lg max-w-md">
            Ürün kataloglarınızı yönetin, kurumsal PDF teklifleri oluşturun ve 
            müşterilerinizle anında paylaşın.
          </p>
          <div className="mt-12 flex gap-8">
            <div>
              <p className="text-3xl font-bold text-orange-400">1000+</p>
              <p className="text-white/70 text-sm">Aktif Kullanıcı</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-orange-400">50K+</p>
              <p className="text-white/70 text-sm">Oluşturulan Teklif</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-slate-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-primary">QuoteMaster Pro</span>
          </div>

          <Card className="border-0 shadow-lg">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl">Hoş Geldiniz</CardTitle>
              <CardDescription>
                Hesabınıza giriş yapın veya yeni hesap oluşturun
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login" data-testid="login-tab">Giriş Yap</TabsTrigger>
                  <TabsTrigger value="register" data-testid="register-tab">Kayıt Ol</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">E-posta</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="ornek@sirket.com"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          className="pl-10"
                          data-testid="login-email"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Şifre</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          id="login-password"
                          type="password"
                          placeholder="••••••••"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className="pl-10"
                          data-testid="login-password"
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full btn-accent"
                      disabled={loading}
                      data-testid="login-submit"
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
                  </form>
                </TabsContent>

                <TabsContent value="register">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="company-name">Şirket Adı</Label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          id="company-name"
                          type="text"
                          placeholder="Şirket Adınız"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          className="pl-10"
                          data-testid="register-company"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-email">E-posta</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          id="register-email"
                          type="email"
                          placeholder="ornek@sirket.com"
                          value={registerEmail}
                          onChange={(e) => setRegisterEmail(e.target.value)}
                          className="pl-10"
                          data-testid="register-email"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password">Şifre</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          id="register-password"
                          type="password"
                          placeholder="En az 6 karakter"
                          value={registerPassword}
                          onChange={(e) => setRegisterPassword(e.target.value)}
                          className="pl-10"
                          data-testid="register-password"
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full btn-accent"
                      disabled={loading}
                      data-testid="register-submit"
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
                    <p className="text-xs text-center text-slate-500">
                      Kayıt olarak{' '}
                      <a href="#" className="text-orange-500 hover:underline">
                        Kullanım Koşullarını
                      </a>{' '}
                      kabul etmiş olursunuz.
                    </p>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;
