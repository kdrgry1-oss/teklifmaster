import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { adminAPI, formatDate } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Skeleton } from '../components/ui/skeleton';
import { Switch } from '../components/ui/switch';
import { toast } from 'sonner';
import {
  Users,
  CreditCard,
  Tag,
  Mail,
  Crown,
  Calendar,
  Loader2,
  Plus,
  Trash2,
  Send,
  FileText,
  BarChart3,
  CheckCircle,
  XCircle,
  Clock,
  Percent,
} from 'lucide-react';

const AdminPanel = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Data states
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  
  // Dialog states
  const [couponDialogOpen, setCouponDialogOpen] = useState(false);
  const [campaignDialogOpen, setCampaignDialogOpen] = useState(false);
  const [savingCoupon, setSavingCoupon] = useState(false);
  const [sendingCampaign, setSendingCampaign] = useState(false);
  
  // Form states
  const [couponForm, setCouponForm] = useState({
    code: '',
    discount_type: 'percent',
    discount_value: 10,
    max_uses: '',
    expires_at: '',
  });
  
  const [campaignForm, setCampaignForm] = useState({
    subject: '',
    content: '',
    recipient_type: 'all',
  });

  useEffect(() => {
    if (user?.is_admin) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, couponsRes, campaignsRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getUsers(),
        adminAPI.getCoupons(),
        adminAPI.getCampaigns(),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setCoupons(couponsRes.data);
      setCampaigns(campaignsRes.data);
    } catch (error) {
      toast.error('Veriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  // Check if user is admin
  if (!user?.is_admin) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleCreateCoupon = async () => {
    if (!couponForm.code || !couponForm.discount_value) {
      toast.error('Kupon kodu ve indirim değeri zorunludur');
      return;
    }
    
    setSavingCoupon(true);
    try {
      await adminAPI.createCoupon({
        ...couponForm,
        max_uses: couponForm.max_uses ? parseInt(couponForm.max_uses) : null,
        expires_at: couponForm.expires_at || null,
      });
      toast.success('Kupon oluşturuldu');
      setCouponDialogOpen(false);
      setCouponForm({ code: '', discount_type: 'percent', discount_value: 10, max_uses: '', expires_at: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Kupon oluşturulamadı');
    } finally {
      setSavingCoupon(false);
    }
  };

  const handleDeleteCoupon = async (id) => {
    if (!window.confirm('Bu kuponu silmek istediğinize emin misiniz?')) return;
    try {
      await adminAPI.deleteCoupon(id);
      toast.success('Kupon silindi');
      fetchData();
    } catch (error) {
      toast.error('Kupon silinemedi');
    }
  };

  const handleToggleCoupon = async (id) => {
    try {
      await adminAPI.toggleCoupon(id);
      fetchData();
    } catch (error) {
      toast.error('Kupon durumu değiştirilemedi');
    }
  };

  const handleSendCampaign = async () => {
    if (!campaignForm.subject || !campaignForm.content) {
      toast.error('Konu ve içerik zorunludur');
      return;
    }
    
    setSendingCampaign(true);
    try {
      const response = await adminAPI.sendCampaign(campaignForm);
      toast.success(response.data.message);
      setCampaignDialogOpen(false);
      setCampaignForm({ subject: '', content: '', recipient_type: 'all' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Kampanya gönderilemedi');
    } finally {
      setSendingCampaign(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <span className="badge-success flex items-center gap-1"><CheckCircle className="w-3 h-3" />Aktif</span>;
      case 'trial':
        return <span className="badge-pending flex items-center gap-1"><Clock className="w-3 h-3" />Deneme</span>;
      case 'expired':
        return <span className="badge-error flex items-center gap-1"><XCircle className="w-3 h-3" />Süresi Dolmuş</span>;
      default:
        return <span className="badge-secondary">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6" data-testid="admin-loading">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="admin-panel">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Yönetici Paneli</h1>
          <p className="text-slate-500">Sistem yönetimi ve istatistikler</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.total_users || 0}</p>
                <p className="text-sm text-slate-500">Toplam Kullanıcı</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Crown className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.active_users || 0}</p>
                <p className="text-sm text-slate-500">Aktif Abonelik</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.trial_users || 0}</p>
                <p className="text-sm text-slate-500">Deneme Sürümü</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.total_quotes || 0}</p>
                <p className="text-sm text-slate-500">Toplam Teklif</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Kullanıcılar
          </TabsTrigger>
          <TabsTrigger value="coupons" className="flex items-center gap-2">
            <Tag className="w-4 h-4" />
            Kuponlar
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Kampanyalar
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Kullanıcı Listesi</CardTitle>
              <CardDescription>Sisteme kayıtlı tüm kullanıcılar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Şirket</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">E-posta</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Durum</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Deneme Bitiş</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Teklifler</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Kayıt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <span className="font-medium">{u.company_name}</span>
                          {u.is_admin && <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">Admin</span>}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{u.email}</td>
                        <td className="py-3 px-4">{getStatusBadge(u.subscription_status)}</td>
                        <td className="py-3 px-4 text-slate-600">
                          {u.trial_end_date ? formatDate(u.trial_end_date) : '-'}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{u.quotes_count || 0}</td>
                        <td className="py-3 px-4 text-slate-600">{formatDate(u.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Coupons Tab */}
        <TabsContent value="coupons">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Kupon Kodları</CardTitle>
                  <CardDescription>Abonelik indirimleri için kupon kodları</CardDescription>
                </div>
                <Button onClick={() => setCouponDialogOpen(true)} data-testid="create-coupon-btn">
                  <Plus className="w-4 h-4 mr-2" />
                  Yeni Kupon
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {coupons.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Tag className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Henüz kupon oluşturulmamış</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Kod</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">İndirim</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Kullanım</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Son Tarih</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Durum</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">İşlem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {coupons.map((coupon) => (
                        <tr key={coupon.id} className="border-b hover:bg-slate-50">
                          <td className="py-3 px-4">
                            <span className="font-mono font-bold bg-slate-100 px-2 py-1 rounded">{coupon.code}</span>
                          </td>
                          <td className="py-3 px-4">
                            {coupon.discount_type === 'percent' ? `%${coupon.discount_value}` : `₺${coupon.discount_value}`}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {coupon.used_count} / {coupon.max_uses || '∞'}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {coupon.expires_at ? formatDate(coupon.expires_at) : 'Süresiz'}
                          </td>
                          <td className="py-3 px-4">
                            <Switch
                              checked={coupon.is_active}
                              onCheckedChange={() => handleToggleCoupon(coupon.id)}
                            />
                          </td>
                          <td className="py-3 px-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700"
                              onClick={() => handleDeleteCoupon(coupon.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>E-posta Kampanyaları</CardTitle>
                  <CardDescription>Toplu e-posta gönderimi</CardDescription>
                </div>
                <Button onClick={() => setCampaignDialogOpen(true)} data-testid="create-campaign-btn">
                  <Plus className="w-4 h-4 mr-2" />
                  Yeni Kampanya
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {campaigns.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Henüz kampanya gönderilmemiş</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {campaigns.map((campaign) => (
                    <div key={campaign.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{campaign.subject}</h4>
                        <span className="text-sm text-slate-500">{formatDate(campaign.sent_at)}</span>
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-2">{campaign.content}</p>
                      <div className="mt-2 flex items-center gap-4 text-sm text-slate-500">
                        <span>Alıcı tipi: {campaign.recipient_type === 'all' ? 'Tümü' : campaign.recipient_type}</span>
                        <span>Gönderim: {campaign.recipient_count} kişi</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Coupon Dialog */}
      <Dialog open={couponDialogOpen} onOpenChange={setCouponDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Kupon Oluştur</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="coupon-code">Kupon Kodu</Label>
              <Input
                id="coupon-code"
                value={couponForm.code}
                onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                placeholder="INDIRIM20"
                className="uppercase"
                data-testid="coupon-code-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>İndirim Tipi</Label>
                <Select
                  value={couponForm.discount_type}
                  onValueChange={(value) => setCouponForm({ ...couponForm, discount_type: value })}
                >
                  <SelectTrigger data-testid="discount-type-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Yüzde (%)</SelectItem>
                    <SelectItem value="amount">Sabit Tutar (₺)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="discount-value">İndirim Değeri</Label>
                <Input
                  id="discount-value"
                  type="number"
                  value={couponForm.discount_value}
                  onChange={(e) => setCouponForm({ ...couponForm, discount_value: parseFloat(e.target.value) })}
                  data-testid="discount-value-input"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="max-uses">Maksimum Kullanım (boş = sınırsız)</Label>
                <Input
                  id="max-uses"
                  type="number"
                  value={couponForm.max_uses}
                  onChange={(e) => setCouponForm({ ...couponForm, max_uses: e.target.value })}
                  placeholder="Sınırsız"
                  data-testid="max-uses-input"
                />
              </div>
              <div>
                <Label htmlFor="expires-at">Son Geçerlilik Tarihi</Label>
                <Input
                  id="expires-at"
                  type="date"
                  value={couponForm.expires_at}
                  onChange={(e) => setCouponForm({ ...couponForm, expires_at: e.target.value })}
                  data-testid="expires-at-input"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCouponDialogOpen(false)}>İptal</Button>
            <Button onClick={handleCreateCoupon} disabled={savingCoupon} data-testid="save-coupon-btn">
              {savingCoupon ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Oluştur
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Campaign Dialog */}
      <Dialog open={campaignDialogOpen} onOpenChange={setCampaignDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Yeni E-posta Kampanyası</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="campaign-subject">Konu</Label>
              <Input
                id="campaign-subject"
                value={campaignForm.subject}
                onChange={(e) => setCampaignForm({ ...campaignForm, subject: e.target.value })}
                placeholder="Kampanya başlığı"
                data-testid="campaign-subject-input"
              />
            </div>
            <div>
              <Label>Alıcı Grubu</Label>
              <Select
                value={campaignForm.recipient_type}
                onValueChange={(value) => setCampaignForm({ ...campaignForm, recipient_type: value })}
              >
                <SelectTrigger data-testid="recipient-type-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Kullanıcılar</SelectItem>
                  <SelectItem value="active">Aktif Aboneler</SelectItem>
                  <SelectItem value="trial">Deneme Kullanıcıları</SelectItem>
                  <SelectItem value="expired">Süresi Dolanlar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="campaign-content">İçerik (HTML destekler)</Label>
              <Textarea
                id="campaign-content"
                value={campaignForm.content}
                onChange={(e) => setCampaignForm({ ...campaignForm, content: e.target.value })}
                placeholder="E-posta içeriği..."
                rows={6}
                data-testid="campaign-content-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCampaignDialogOpen(false)}>İptal</Button>
            <Button onClick={handleSendCampaign} disabled={sendingCampaign} data-testid="send-campaign-btn">
              {sendingCampaign ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Gönder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPanel;
