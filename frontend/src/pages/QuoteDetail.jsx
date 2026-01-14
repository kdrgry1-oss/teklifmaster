import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { quotesAPI, formatCurrency, formatDate } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Download,
  Share2,
  Mail,
  Clock,
  Send,
  CheckCircle,
  XCircle,
  User,
  Calendar,
  FileText,
  Building,
  Edit2,
} from 'lucide-react';

const statusConfig = {
  draft: { label: 'Taslak', icon: Clock, color: 'bg-slate-100 text-slate-700' },
  sent: { label: 'Gönderildi', icon: Send, color: 'bg-blue-100 text-blue-700' },
  accepted: { label: 'Kabul Edildi', icon: CheckCircle, color: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: 'Reddedildi', icon: XCircle, color: 'bg-red-100 text-red-700' },
};

const QuoteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuote();
  }, [id]);

  const fetchQuote = async () => {
    try {
      const response = await quotesAPI.getById(id);
      setQuote(response.data);
    } catch (error) {
      toast.error('Teklif yüklenemedi');
      navigate('/quotes');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      const response = await quotesAPI.getPdf(quote.id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Teklif_${quote.quote_number}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('PDF indirildi');
    } catch (error) {
      toast.error('PDF indirilemedi');
    }
  };

  const handleShareWhatsApp = async () => {
    const message = `Sayın ${quote.customer_name},\n\n${quote.quote_number} numaralı teklifimizi iletiyoruz.\n\nToplam: ${formatCurrency(quote.total)}\n\nİyi günler dileriz.`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');

    if (quote.status === 'draft') {
      try {
        await quotesAPI.updateStatus(quote.id, 'sent');
        fetchQuote();
      } catch (error) {
        console.error('Status update failed');
      }
    }
  };

  const handleShareEmail = async () => {
    const subject = `${quote.quote_number} - Fiyat Teklifi`;
    const body = `Sayın ${quote.customer_name},\n\n${quote.quote_number} numaralı teklifimizi ekte iletiyoruz.\n\nToplam: ${formatCurrency(quote.total)}\n\nSorularınız için bize ulaşabilirsiniz.\n\nİyi günler dileriz.`;
    window.location.href = `mailto:${quote.customer_email || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    if (quote.status === 'draft') {
      try {
        await quotesAPI.updateStatus(quote.id, 'sent');
        fetchQuote();
      } catch (error) {
        console.error('Status update failed');
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-6" data-testid="quote-detail-loading">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-60 col-span-2" />
          <Skeleton className="h-60" />
        </div>
      </div>
    );
  }

  if (!quote) return null;

  const status = statusConfig[quote.status] || statusConfig.draft;
  const StatusIcon = status.icon;

  return (
    <div className="animate-fade-in" data-testid="quote-detail-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/quotes')} data-testid="back-btn">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Geri
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 font-mono">{quote.quote_number}</h1>
              <Badge className={status.color}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {status.label}
              </Badge>
            </div>
            <p className="text-slate-500">{quote.customer_name}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to={`/quotes/${quote.id}/edit`}>
            <Button variant="outline" data-testid="edit-quote-btn">
              <Edit2 className="w-4 h-4 mr-2" />
              Düzenle
            </Button>
          </Link>
          <Button variant="outline" onClick={handleShareWhatsApp} data-testid="share-whatsapp-btn">
            <Share2 className="w-4 h-4 mr-2" />
            WhatsApp
          </Button>
          <Button variant="outline" onClick={handleShareEmail} data-testid="share-email-btn">
            <Mail className="w-4 h-4 mr-2" />
            E-posta
          </Button>
          <Button className="btn-accent" onClick={handleDownloadPdf} data-testid="download-pdf-btn">
            <Download className="w-4 h-4 mr-2" />
            PDF İndir
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <Card data-testid="customer-info">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5" />
                Müşteri Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Müşteri</p>
                  <p className="font-medium">{quote.customer_name}</p>
                </div>
                {quote.customer_tax_number && (
                  <div>
                    <p className="text-sm text-slate-500">Vergi Numarası</p>
                    <p className="font-medium font-mono">{quote.customer_tax_number}</p>
                  </div>
                )}
                {quote.customer_email && (
                  <div>
                    <p className="text-sm text-slate-500">E-posta</p>
                    <p className="font-medium">{quote.customer_email}</p>
                  </div>
                )}
                {quote.customer_phone && (
                  <div>
                    <p className="text-sm text-slate-500">Telefon</p>
                    <p className="font-medium">{quote.customer_phone}</p>
                  </div>
                )}
                {quote.customer_address && (
                  <div className="col-span-2">
                    <p className="text-sm text-slate-500">Adres</p>
                    <p className="font-medium">{quote.customer_address}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card data-testid="quote-items">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Teklif Kalemleri
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full data-table">
                  <thead>
                    <tr>
                      <th className="text-left py-3 px-4">#</th>
                      <th className="text-left py-3 px-4">Ürün/Hizmet</th>
                      <th className="text-right py-3 px-4">Miktar</th>
                      <th className="text-right py-3 px-4">Birim Fiyat</th>
                      <th className="text-right py-3 px-4">İskonto</th>
                      <th className="text-right py-3 px-4">KDV</th>
                      <th className="text-right py-3 px-4">Toplam</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quote.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-3 px-4">{idx + 1}</td>
                        <td className="py-3 px-4">
                          <p className="font-medium">{item.product_name}</p>
                        </td>
                        <td className="py-3 px-4 text-right font-mono">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="py-3 px-4 text-right font-mono">
                          {formatCurrency(item.unit_price)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono">
                          {item.discount_percent > 0 ? `${item.discount_percent}%` : '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono">%{item.vat_rate}</td>
                        <td className="py-3 px-4 text-right font-mono font-semibold">
                          {formatCurrency(item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Bank Accounts */}
          {quote.bank_accounts && quote.bank_accounts.length > 0 && (
            <Card data-testid="bank-accounts">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Ödeme Bilgileri
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quote.bank_accounts.map((account) => (
                    <div key={account.id} className="p-4 bg-slate-50 rounded-lg">
                      <p className="font-semibold">{account.bank_name}</p>
                      <p className="font-mono text-sm mt-1">{account.iban}</p>
                      {account.account_holder && (
                        <p className="text-sm text-slate-500 mt-1">{account.account_holder}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {quote.notes && (
            <Card data-testid="quote-notes">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Notlar</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 whitespace-pre-wrap">{quote.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Summary */}
          <Card data-testid="quote-summary">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Özet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-sm text-slate-500">Oluşturulma Tarihi</p>
                  <p className="font-medium">{formatDate(quote.created_at)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-sm text-slate-500">Geçerlilik Tarihi</p>
                  <p className="font-medium">{formatDate(quote.validity_date)}</p>
                </div>
              </div>

              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Ara Toplam</span>
                  <span className="font-mono">{formatCurrency(quote.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">KDV</span>
                  <span className="font-mono">{formatCurrency(quote.total_vat)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Genel Toplam</span>
                  <span className="font-mono text-orange-500">{formatCurrency(quote.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default QuoteDetail;
