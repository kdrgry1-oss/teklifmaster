import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
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
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  const [cardData, setCardData] = useState({
    card_holder_name: '',
    card_number: '',
    expire_month: '',
    expire_year: '',
    cvc: '',
  });

  useEffect(() => {
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

  const handleSubscribe = async () => {
    if (!cardData.card_holder_name || !cardData.card_number || !cardData.expire_month || !cardData.expire_year || !cardData.cvc) {
      toast.error('Lütfen tüm kart bilgilerini doldurun');
      return;
    }

    setProcessing(true);
    try {
      const data = {
        ...cardData,
        card_number: cardData.card_number.replace(/\s/g, ''),
      };
      
      await subscriptionAPI.subscribe(data);
      toast.success('Abonelik başarıyla oluşturuldu!');
      setDialogOpen(false);
      fetchSubscription();
      
      // Update user status
      updateUser({ ...user, subscription_status: 'active' });
    } catch (error) {
      toast.error('Abonelik oluşturulamadı');
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

      {/* Plan Card */}
      <Card className="border-2 border-orange-200" data-testid="plan-card">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Pro Plan</CardTitle>
              <CardDescription>Tüm özellikler sınırsız</CardDescription>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-orange-500">₺100</p>
              <p className="text-sm text-slate-500">/ay</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-orange-600" />
                  </div>
                  <span className="text-sm">{feature.text}</span>
                </div>
              );
            })}
          </div>

          {!isSubscribed ? (
            <Button
              className="w-full btn-accent h-12 text-base"
              onClick={() => setDialogOpen(true)}
              data-testid="subscribe-btn"
            >
              <CreditCard className="w-5 h-5 mr-2" />
              Pro'ya Yükselt
            </Button>
          ) : (
            <Button
              variant="outline"
              className="w-full text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={handleCancel}
              data-testid="cancel-subscription-btn"
            >
              Aboneliği İptal Et
            </Button>
          )}
        </CardContent>
      </Card>

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
            <div className="p-4 bg-orange-50 rounded-lg mb-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Pro Plan - Aylık</span>
                <span className="text-xl font-bold text-orange-500">₺100</span>
              </div>
            </div>

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
                  ₺100 Öde
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
