import React, { useState, useEffect } from 'react';
import { reportsAPI, formatCurrency, formatDate } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { toast } from 'sonner';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  BarChart3,
  Calendar as CalendarIcon,
  TrendingUp,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Users,
  DollarSign,
  Percent,
} from 'lucide-react';

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  useEffect(() => {
    fetchReport();
  }, [dateRange]);

  const fetchReport = async () => {
    if (!dateRange.from || !dateRange.to) return;
    
    setLoading(true);
    try {
      const startDate = format(dateRange.from, 'yyyy-MM-dd');
      const endDate = format(dateRange.to, 'yyyy-MM-dd');
      const response = await reportsAPI.get(startDate, endDate);
      setReportData(response.data);
    } catch (error) {
      toast.error('Rapor yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const setPresetRange = (preset) => {
    const today = new Date();
    switch (preset) {
      case 'last7':
        setDateRange({ from: subDays(today, 7), to: today });
        break;
      case 'last30':
        setDateRange({ from: subDays(today, 30), to: today });
        break;
      case 'thisMonth':
        setDateRange({ from: startOfMonth(today), to: today });
        break;
      case 'lastMonth':
        const lastMonth = subMonths(today, 1);
        setDateRange({ from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) });
        break;
      case 'last90':
        setDateRange({ from: subDays(today, 90), to: today });
        break;
      default:
        break;
    }
  };

  if (loading && !reportData) {
    return (
      <div className="space-y-6" data-testid="reports-loading">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 w-full max-w-md" />
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

  const summary = reportData?.summary || {};
  const statusCounts = summary.status_counts || {};

  return (
    <div className="space-y-6 animate-fade-in" data-testid="reports-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Raporlar</h1>
          <p className="text-slate-500">Teklif performansınızı analiz edin</p>
        </div>
      </div>

      {/* Date Range Selector */}
      <Card data-testid="date-range-card">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-slate-600">Tarih Aralığı:</span>
            
            {/* Preset Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => setPresetRange('last7')}>
                Son 7 Gün
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPresetRange('last30')}>
                Son 30 Gün
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPresetRange('thisMonth')}>
                Bu Ay
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPresetRange('lastMonth')}>
                Geçen Ay
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPresetRange('last90')}>
                Son 90 Gün
              </Button>
            </div>

            {/* Custom Date Picker */}
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="min-w-[240px] justify-start" data-testid="date-picker-btn">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {dateRange.from && dateRange.to ? (
                    <>
                      {format(dateRange.from, 'dd MMM yyyy', { locale: tr })} -{' '}
                      {format(dateRange.to, 'dd MMM yyyy', { locale: tr })}
                    </>
                  ) : (
                    'Tarih Seçin'
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={(range) => {
                    if (range?.from && range?.to) {
                      setDateRange(range);
                      setIsCalendarOpen(false);
                    } else if (range?.from) {
                      setDateRange({ from: range.from, to: range.from });
                    }
                  }}
                  numberOfMonths={2}
                  locale={tr}
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="card-hover" data-testid="stat-total-quotes">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Toplam Teklif</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {summary.total_quotes || 0}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover" data-testid="stat-conversion">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Dönüşüm Oranı</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  %{summary.conversion_rate || 0}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center">
                <Percent className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover" data-testid="stat-accepted-value">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Onaylanan Ciro</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1 font-mono">
                  {formatCurrency(summary.accepted_value || 0)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover" data-testid="stat-total-value">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Toplam Teklif Değeri</p>
                <p className="text-2xl font-bold text-slate-900 mt-1 font-mono">
                  {formatCurrency(summary.total_value || 0)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-slate-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown & Top Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Breakdown */}
        <Card data-testid="status-breakdown">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Teklif Durumları
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-slate-200 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-slate-600" />
                </div>
                <span className="font-medium">Taslak</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-semibold">{statusCounts.draft || 0}</span>
                <p className="text-xs text-slate-500">{formatCurrency(summary.pending_value || 0)}</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-blue-200 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                <span className="font-medium">Gönderildi</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-semibold">{statusCounts.sent || 0}</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-emerald-200 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                </div>
                <span className="font-medium">Kabul Edildi</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-semibold text-emerald-600">{statusCounts.accepted || 0}</span>
                <p className="text-xs text-emerald-600">{formatCurrency(summary.accepted_value || 0)}</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-red-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-red-200 flex items-center justify-center">
                  <XCircle className="w-4 h-4 text-red-600" />
                </div>
                <span className="font-medium">Reddedildi</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-semibold text-red-600">{statusCounts.rejected || 0}</span>
                <p className="text-xs text-red-500">{formatCurrency(summary.rejected_value || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Customers */}
        <Card data-testid="top-customers">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5" />
              En Çok Kazandıran Müşteriler
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reportData?.top_customers?.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p>Henüz onaylanmış teklif yok</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reportData?.top_customers?.map((customer, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-semibold text-sm">
                        {idx + 1}
                      </div>
                      <span className="font-medium truncate max-w-[200px]">{customer.name}</span>
                    </div>
                    <span className="font-semibold font-mono text-emerald-600">
                      {formatCurrency(customer.total)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Breakdown */}
      {reportData?.monthly_breakdown?.length > 0 && (
        <Card data-testid="monthly-breakdown">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Aylık Özet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full data-table">
                <thead>
                  <tr>
                    <th className="text-left py-3 px-4">Ay</th>
                    <th className="text-right py-3 px-4">Toplam Teklif</th>
                    <th className="text-right py-3 px-4">Onaylanan</th>
                    <th className="text-right py-3 px-4">Toplam Değer</th>
                    <th className="text-right py-3 px-4">Onaylanan Ciro</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.monthly_breakdown.map((month, idx) => (
                    <tr key={idx}>
                      <td className="py-3 px-4 font-medium">
                        {format(new Date(month.month + '-01'), 'MMMM yyyy', { locale: tr })}
                      </td>
                      <td className="py-3 px-4 text-right">{month.quotes}</td>
                      <td className="py-3 px-4 text-right text-emerald-600 font-medium">{month.accepted}</td>
                      <td className="py-3 px-4 text-right font-mono">{formatCurrency(month.total)}</td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-600">
                        {formatCurrency(month.accepted_value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Reports;
