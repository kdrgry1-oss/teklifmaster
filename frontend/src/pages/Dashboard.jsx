import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI, formatCurrency, formatDate } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import {
  Package,
  FileText,
  TrendingUp,
  Calendar,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle,
  XCircle,
  Send,
} from 'lucide-react';

const statusConfig = {
  draft: { label: 'Taslak', icon: Clock, color: 'text-slate-500', bg: 'bg-slate-100' },
  sent: { label: 'Gönderildi', icon: Send, color: 'text-blue-600', bg: 'bg-blue-50' },
  accepted: { label: 'Kabul Edildi', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  rejected: { label: 'Reddedildi', icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
};

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await dashboardAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Dashboard verileri yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6" data-testid="dashboard-loading">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="dashboard">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500">Teklif ve ürün yönetim özeti</p>
        </div>
        <Link to="/quotes/new">
          <Button className="btn-accent" data-testid="create-quote-btn">
            <Plus className="w-4 h-4 mr-2" />
            Yeni Teklif Oluştur
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="card-hover" data-testid="stat-products">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Toplam Ürün</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {stats?.total_products || 0}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover" data-testid="stat-quotes">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Toplam Teklif</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {stats?.total_quotes || 0}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center">
                <FileText className="w-6 h-6 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover" data-testid="stat-monthly-total">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Bu Ay Toplam</p>
                <p className="text-2xl font-bold text-slate-900 mt-1 font-mono">
                  {formatCurrency(stats?.monthly_total || 0)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover" data-testid="stat-monthly-quotes">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Bu Ay Teklif</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {stats?.monthly_quote_count || 0}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Overview */}
        <Card className="lg:col-span-1" data-testid="status-overview">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Teklif Durumları</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(statusConfig).map(([key, config]) => {
              const Icon = config.icon;
              const count = stats?.status_counts?.[key] || 0;
              return (
                <div
                  key={key}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-md ${config.bg} flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${config.color}`} />
                    </div>
                    <span className="font-medium text-slate-700">{config.label}</span>
                  </div>
                  <span className="text-lg font-semibold text-slate-900">{count}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Recent Quotes */}
        <Card className="lg:col-span-2" data-testid="recent-quotes">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Son Teklifler</CardTitle>
            <Link to="/quotes">
              <Button variant="ghost" size="sm" className="text-orange-500 hover:text-orange-600">
                Tümünü Gör
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {stats?.recent_quotes?.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>Henüz teklif oluşturulmadı</p>
                <Link to="/quotes/new">
                  <Button variant="link" className="text-orange-500 mt-2">
                    İlk teklifinizi oluşturun
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {stats?.recent_quotes?.map((quote) => {
                  const status = statusConfig[quote.status] || statusConfig.draft;
                  const StatusIcon = status.icon;
                  return (
                    <Link
                      key={quote.id}
                      to={`/quotes/${quote.id}`}
                      className="flex items-center justify-between p-4 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-md ${status.bg} flex items-center justify-center`}>
                          <StatusIcon className={`w-5 h-5 ${status.color}`} />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{quote.customer_name}</p>
                          <p className="text-sm text-slate-500">
                            {quote.quote_number} • {formatDate(quote.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold font-mono text-slate-900">
                          {formatCurrency(quote.total)}
                        </p>
                        <span className={`text-xs ${status.color}`}>{status.label}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card data-testid="quick-actions">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Hızlı İşlemler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/quotes/new">
              <div className="p-4 rounded-lg border border-slate-200 hover:border-orange-300 hover:bg-orange-50/50 transition-colors text-center cursor-pointer">
                <FileText className="w-8 h-8 mx-auto mb-2 text-orange-500" />
                <p className="font-medium text-sm">Yeni Teklif</p>
              </div>
            </Link>
            <Link to="/products">
              <div className="p-4 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-colors text-center cursor-pointer">
                <Package className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <p className="font-medium text-sm">Ürün Ekle</p>
              </div>
            </Link>
            <Link to="/bank-accounts">
              <div className="p-4 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-colors text-center cursor-pointer">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 text-emerald-600" />
                <p className="font-medium text-sm">Banka Hesabı</p>
              </div>
            </Link>
            <Link to="/settings">
              <div className="p-4 rounded-lg border border-slate-200 hover:border-purple-300 hover:bg-purple-50/50 transition-colors text-center cursor-pointer">
                <Calendar className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                <p className="font-medium text-sm">Şirket Ayarları</p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
