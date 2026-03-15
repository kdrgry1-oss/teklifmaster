import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { subscriptionAPI, formatDate } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Skeleton } from '../components/ui/skeleton';
import { toast } from 'sonner';
import {
  CreditCard,
  Check,
  Crown,
  Calendar,
  AlertCircle,
  Loader2,
  Package,
  FileText,
  Download,
  Zap,
} from 'lucide-react';

const Subscription = () => {
  const { user, updateUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('monthly'); // 'monthly' or 'yearly'

  const MONTHLY_PRICE = 299;
  const YEARLY_PRICE = 2990;

  const [cardData, setCardData] = useState({
    card_holder_name: '',
    card_number: '',
    expire_month: '',
    expire_year: '',
    cvc: '',
  });

  useEffect(() => {
    // Check for callback status
    const status = searchParams.get('status');
    const error = searchParams.get('error');
    
    if (status === 'success') {
      toast.success('Ödeme başarılı! Aboneliğiniz aktif.');
      updateUser({ ...user, subscription_status: 'active' });
      setSearchParams({});
    } else if (status === 'failed') {
      toast.error(error || 'Ödeme başarısız oldu');
      setSearchParams({});
    } else if (status === 'error') {
      toast.error('Ödeme işlemi sırasında bir hata oluştu');
      setSearchParams({});
    }
    
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const response = await subscriptionAPI.getStatus();
      setSubscriptionData(response.data);
    } catch (error) {
      toast.error('Abonelik bilgileri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const formatCardNumber = (value) => {
    const cleaned = value.replace(/\D/g, '');
    const parts = cleaned.match(/.{1,4}/g) || [];
    return parts.join(' ').slice(0, 19);
  };

  const calculateFinalPrice = () => {
    const basePrice = selectedPlan === 'yearly' ? YEARLY_PRICE : MONTHLY_PRICE;
    if (!appliedCoupon) return basePrice;
    if (appliedCoupon.discount_type === 'percent') {
      return basePrice - (basePrice * appliedCoupon.discount_value / 100);
    }
    return Math.max(0, basePrice - appliedCoupon.discount_value);
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Kupon kodu girin');
      return;
    }
    setApplyingCoupon(true);
    try {
      const response = await subscriptionAPI.validateCoupon(couponCode);
      setAppliedCoupon(response.data);
      toast.success('Kupon uygulandı!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Geçersiz kupon kodu');
      setAppliedCoupon(null);
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
  };

  const handleSubscribe = async () => {
    if (!cardData.card_holder_name || !cardData.card_number || !cardData.expire_month || !cardData.expire_year || !cardData.cvc) {
      toast.error('Lütfen tüm kart bilgilerini doldurun');
      return;
    }

    // Validate card number
    const cleanCardNumber = cardData.card_number.replace(/\s/g, '');
    if (cleanCardNumber.length < 15 || cleanCardNumber.length > 16) {
      toast.error('Geçersiz kart numarası');
      return;
    }

    // Validate expire date
    const month = parseInt(cardData.expire_month);
    if (month < 1 || month > 12) {
      toast.error('Geçersiz son kullanma ayı');
      return;
    }

    setProcessing(true);
    try {
      const data = {
        ...cardData,
        card_number: cleanCardNumber,
        expire_year: cardData.expire_year.length === 2 ? '20' + cardData.expire_year : cardData.expire_year,
      };
      
      const response = await subscriptionAPI.subscribe(data);
      
      // Check if 3D Secure is required
      if (response.data.status === '3ds_required' && response.data.threeds_html_content) {
        // Open 3D Secure in a new window or iframe
        const threeDSWindow = window.open('', '_blank', 'width=500,height=600');
        if (threeDSWindow) {
          threeDSWindow.document.write(response.data.threeds_html_content);
          threeDSWindow.document.close();
          
          toast.info('3D Secure doğrulaması için yeni pencereyi kontrol edin');
          setDialogOpen(false);
          
          // Poll for completion
          const checkInterval = setInterval(async () => {
            try {
              const statusResponse = await subscriptionAPI.getStatus();
              if (statusResponse.data.status === 'active') {
                clearInterval(checkInterval);
                toast.success('Ödeme başarılı! Aboneliğiniz aktif.');
                fetchSubscription();
                updateUser({ ...user, subscription_status: 'active' });
              }
            } catch (e) {
              // Continue polling
            }
          }, 3000);
          
          // Stop polling after 5 minutes
          setTimeout(() => clearInterval(checkInterval), 300000);
        } else {
          toast.error('Popup engelleyici aktif. Lütfen popup engelleyiciyi kapatın.');
        }
      } else {
        toast.success('Ödeme başarılı! Aboneliğiniz aktif.');
        setDialogOpen(false);
        setCardData({
          card_holder_name: '',
          card_number: '',
          expire_month: '',
          expire_year: '',
          cvc: '',
        });
        fetchSubscription();
        updateUser({ ...user, subscription_status: 'active' });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Ödeme işlemi başarısız oldu. Lütfen kart bilgilerinizi kontrol edin.';
      toast.error(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Aboneliğinizi iptal etmek istediğinize emin misiniz?')) {
      return;
    }

    try {
      await subscriptionAPI.cancel();
      toast.success('Abonelik iptal edildi');
      fetchSubscription();
      updateUser({ ...user, subscription_status: 'cancelled' });
    } catch (error) {
      toast.error('Abonelik iptal edilemedi');
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6" data-testid="subscription-loading">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const isTrialActive = subscriptionData?.is_trial_active;
  const isSubscribed = subscriptionData?.status === 'active';
  const trialEndDate = subscriptionData?.trial_end_date ? new Date(subscriptionData.trial_end_date) : null;
  const daysLeft = trialEndDate ? Math.max(0, Math.ceil((trialEndDate - new Date()) / (1000 * 60 * 60 * 24))) : 0;

  const features = [
    { icon: Package, text: 'Sınırsız ürün ekleme' },
    { icon: FileText, text: 'Sınırsız teklif oluşturma' },
    { icon: Download, text: 'PDF teklif indirme' },
    { icon: Zap, text: 'WhatsApp & E-posta paylaşımı' },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in" data-testid="subscription-page">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Abonelik</h1>
        <p className="text-slate-500">Abonelik durumunuzu yönetin</p>
      </div>

      {/* Current Status */}
      <Card data-testid="subscription-status-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                isSubscribed ? 'bg-orange-100' : 'bg-slate-100'
              }`}>
                <Crown className={`w-7 h-7 ${isSubscribed ? 'text-orange-500' : 'text-slate-400'}`} />
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {isSubscribed ? 'Pro Üyelik' : isTrialActive ? 'Deneme Sürümü' : 'Ücretsiz'}
                </h2>
                {isTrialActive && !isSubscribed && (
                  <p className="text-slate-500">
                    <span className="text-orange-500 font-semibold">{daysLeft} gün</span> kaldı
                  </p>
                )}
                {isSubscribed && subscriptionData.subscription && (
                  <p className="text-slate-500">
                    Sonraki ödeme: {formatDate(subscriptionData.subscription.next_payment_date)}
                  </p>
                )}
              </div>
            </div>
            {isSubscribed ? (
              <span className="badge-success flex items-center gap-1">
                <Check className="w-3 h-3" />
                Aktif
              </span>
            ) : isTrialActive ? (
              <span className="badge-pending flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Deneme
              </span>
            ) : (
              <span className="badge-error flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Pasif
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Plan Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Monthly Plan */}
        <Card 
          className={`cursor-pointer transition-all ${selectedPlan === 'monthly' ? 'border-2 border-orange-500 shadow-lg' : 'border-2 border-slate-200 hover:border-slate-300'}`}
          onClick={() => setSelectedPlan('monthly')}
          data-testid="monthly-plan-card"
        >
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Aylık Plan</CardTitle>
                <CardDescription>Esnek ödeme</CardDescription>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-slate-900">₺299</p>
                <p className="text-sm text-slate-500">/ay</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 mb-4">
              {features.slice(0, 3).map((feature, idx) => {
                const Icon = feature.icon;
                return (
                  <div key={idx} className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-orange-500" />
                    <span className="text-sm text-slate-600">{feature.text}</span>
                  </div>
                );
              })}
            </div>
            {!isSubscribed && (
              <Button
                className={`w-full ${selectedPlan === 'monthly' ? 'btn-accent' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                onClick={(e) => { e.stopPropagation(); setSelectedPlan('monthly'); setDialogOpen(true); }}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Aylık Başla
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Yearly Plan */}
        <Card 
          className={`cursor-pointer transition-all relative ${selectedPlan === 'yearly' ? 'border-2 border-orange-500 shadow-lg' : 'border-2 border-slate-200 hover:border-slate-300'}`}
          onClick={() => setSelectedPlan('yearly')}
          data-testid="yearly-plan-card"
        >
          <div className="absolute -top-3 right-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
            2 AY BEDAVA
          </div>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Yıllık Plan</CardTitle>
                <CardDescription>En avantajlı</CardDescription>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-orange-500">₺2990</p>
                <p className="text-sm text-slate-500">/yıl</p>
                <p className="text-xs text-green-600 font-medium">₺249/ay</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="bg-green-50 text-green-700 text-sm p-2 rounded-lg mb-4 text-center">
              <span className="line-through text-slate-400 mr-1">₺3588</span>
              <span className="font-semibold">₺598 tasarruf!</span>
            </div>
            <div className="space-y-2 mb-4">
              {features.map((feature, idx) => {
                const Icon = feature.icon;
                return (
                  <div key={idx} className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-orange-500" />
                    <span className="text-sm text-slate-600">{feature.text}</span>
                  </div>
                );
              })}
            </div>
            {!isSubscribed && (
              <Button
                className="w-full btn-accent"
                onClick={(e) => { e.stopPropagation(); setSelectedPlan('yearly'); setDialogOpen(true); }}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Yıllık Başla
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {isSubscribed && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">Aktif Abonelik</p>
                {subscriptionData.subscription && (
                  <p className="text-sm text-slate-600">
                    Sonraki ödeme: {formatDate(subscriptionData.subscription.next_payment_date)}
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={handleCancel}
                data-testid="cancel-subscription-btn"
              >
                Aboneliği İptal Et
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm text-blue-800 font-medium">Iyzico Güvenli Ödeme</p>
            <p className="text-sm text-blue-700">
              Ödeme işlemleri Iyzico altyapısı ile güvenli bir şekilde gerçekleştirilir.
              Kart bilgileriniz saklanmaz.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md" data-testid="payment-dialog">
          <DialogHeader>
            <DialogTitle>Ödeme Bilgileri</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Plan Selection */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={() => setSelectedPlan('monthly')}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  selectedPlan === 'monthly' 
                    ? 'border-orange-500 bg-orange-50' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <p className="font-semibold">Aylık Plan</p>
                <p className="text-2xl font-bold text-orange-500">₺299<span className="text-sm text-slate-500 font-normal">/ay</span></p>
              </button>
              <button
                onClick={() => setSelectedPlan('yearly')}
                className={`p-4 rounded-lg border-2 text-left transition-all relative ${
                  selectedPlan === 'yearly' 
                    ? 'border-orange-500 bg-orange-50' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <span className="absolute -top-2 right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded">2 AY BEDAVA</span>
                <p className="font-semibold">Yıllık Plan</p>
                <p className="text-2xl font-bold text-orange-500">₺2990<span className="text-sm text-slate-500 font-normal">/yıl</span></p>
                <p className="text-xs text-green-600">₺249/ay (₺598 tasarruf)</p>
              </button>
            </div>

            <div className="p-4 bg-orange-50 rounded-lg mb-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">{selectedPlan === 'yearly' ? 'Yıllık Plan' : 'Aylık Plan'}</span>
                <div className="text-right">
                  {appliedCoupon && (
                    <span className="text-sm text-slate-400 line-through mr-2">
                      ₺{selectedPlan === 'yearly' ? YEARLY_PRICE : MONTHLY_PRICE}
                    </span>
                  )}
                  <span className="text-xl font-bold text-orange-500">₺{calculateFinalPrice()}</span>
                </div>
              </div>
              {appliedCoupon && (
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-green-600">
                    Kupon: {appliedCoupon.discount_type === 'percent' 
                      ? `%${appliedCoupon.discount_value} indirim` 
                      : `₺${appliedCoupon.discount_value} indirim`}
                  </span>
                  <button onClick={handleRemoveCoupon} className="text-red-500 hover:underline">
                    Kaldır
                  </button>
                </div>
              )}
            </div>

            {/* Coupon Code */}
            {!appliedCoupon && (
              <div className="flex gap-2">
                <Input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Kupon kodu"
                  className="flex-1"
                  data-testid="coupon-input"
                />
                <Button 
                  variant="outline" 
                  onClick={handleApplyCoupon}
                  disabled={applyingCoupon}
                  data-testid="apply-coupon-btn"
                >
                  {applyingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Uygula'}
                </Button>
              </div>
            )}

            <div>
              <Label htmlFor="card_holder">Kart Üzerindeki İsim</Label>
              <Input
                id="card_holder"
                value={cardData.card_holder_name}
                onChange={(e) => setCardData({ ...cardData, card_holder_name: e.target.value })}
                placeholder="AD SOYAD"
                className="uppercase"
                data-testid="card-holder-input"
              />
            </div>

            <div>
              <Label htmlFor="card_number">Kart Numarası</Label>
              <Input
                id="card_number"
                value={cardData.card_number}
                onChange={(e) => setCardData({ ...cardData, card_number: formatCardNumber(e.target.value) })}
                placeholder="0000 0000 0000 0000"
                className="font-mono tracking-wider"
                maxLength={19}
                data-testid="card-number-input"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="expire_month">Ay</Label>
                <Input
                  id="expire_month"
                  value={cardData.expire_month}
                  onChange={(e) => setCardData({ ...cardData, expire_month: e.target.value.slice(0, 2) })}
                  placeholder="AA"
                  maxLength={2}
                  className="text-center font-mono"
                  data-testid="expire-month-input"
                />
              </div>
              <div>
                <Label htmlFor="expire_year">Yıl</Label>
                <Input
                  id="expire_year"
                  value={cardData.expire_year}
                  onChange={(e) => setCardData({ ...cardData, expire_year: e.target.value.slice(0, 2) })}
                  placeholder="YY"
                  maxLength={2}
                  className="text-center font-mono"
                  data-testid="expire-year-input"
                />
              </div>
              <div>
                <Label htmlFor="cvc">CVC</Label>
                <Input
                  id="cvc"
                  type="password"
                  value={cardData.cvc}
                  onChange={(e) => setCardData({ ...cardData, cvc: e.target.value.slice(0, 3) })}
                  placeholder="•••"
                  maxLength={3}
                  className="text-center font-mono"
                  data-testid="cvc-input"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              İptal
            </Button>
            <Button
              onClick={handleSubscribe}
              disabled={processing}
              className="btn-accent"
              data-testid="confirm-payment-btn"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  İşleniyor...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  ₺{calculateFinalPrice()} Öde
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Subscription;
