import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { quotesAPI, formatCurrency, formatDate } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  FileText,
  Download,
  Share2,
  Trash2,
  MoreVertical,
  Clock,
  Send,
  CheckCircle,
  XCircle,
  Eye,
  Mail,
} from 'lucide-react';

const statusConfig = {
  draft: { label: 'Taslak', icon: Clock, color: 'text-slate-500', bg: 'bg-slate-100' },
  sent: { label: 'Gönderildi', icon: Send, color: 'text-blue-600', bg: 'bg-blue-50' },
  accepted: { label: 'Kabul Edildi', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  rejected: { label: 'Reddedildi', icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
};

const Quotes = () => {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      const response = await quotesAPI.getAll();
      setQuotes(response.data);
    } catch (error) {
      toast.error('Teklifler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async (quote) => {
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

  const handleShareWhatsApp = async (quote) => {
    const message = `Sayın ${quote.customer_name},\n\n${quote.quote_number} numaralı teklifimizi iletiyoruz.\n\nToplam: ${formatCurrency(quote.total)}\n\nİyi günler dileriz.`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    // Update status to sent
    if (quote.status === 'draft') {
      try {
        await quotesAPI.updateStatus(quote.id, 'sent');
        fetchQuotes();
      } catch (error) {
        console.error('Status update failed');
      }
    }
  };

  const handleShareEmail = async (quote) => {
    const subject = `${quote.quote_number} - Fiyat Teklifi`;
    const body = `Sayın ${quote.customer_name},\n\n${quote.quote_number} numaralı teklifimizi ekte iletiyoruz.\n\nToplam: ${formatCurrency(quote.total)}\n\nSorularınız için bize ulaşabilirsiniz.\n\nİyi günler dileriz.`;
    window.location.href = `mailto:${quote.customer_email || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    if (quote.status === 'draft') {
      try {
        await quotesAPI.updateStatus(quote.id, 'sent');
        fetchQuotes();
      } catch (error) {
        console.error('Status update failed');
      }
    }
  };

  const handleDelete = async (quote) => {
    if (!window.confirm(`"${quote.quote_number}" teklifini silmek istediğinize emin misiniz?`)) {
      return;
    }

    try {
      await quotesAPI.delete(quote.id);
      toast.success('Teklif silindi');
      fetchQuotes();
    } catch (error) {
      toast.error('Teklif silinemedi');
    }
  };

  const handleStatusChange = async (quote, newStatus) => {
    try {
      await quotesAPI.updateStatus(quote.id, newStatus);
      toast.success('Durum güncellendi');
      fetchQuotes();
    } catch (error) {
      toast.error('Durum güncellenemedi');
    }
  };

  const filteredQuotes = quotes.filter((q) => {
    const matchesSearch =
      q.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.quote_number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="space-y-6" data-testid="quotes-loading">
        <div className="flex justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-6 w-1/2 mb-2" />
                <Skeleton className="h-4 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="quotes-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Teklifler</h1>
          <p className="text-slate-500">{quotes.length} teklif</p>
        </div>
        <Link to="/quotes/new">
          <Button className="btn-accent" data-testid="create-quote-btn">
            <Plus className="w-4 h-4 mr-2" />
            Yeni Teklif
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Teklif veya müşteri ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="quote-search"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'draft', 'sent', 'accepted', 'rejected'].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className={statusFilter === status ? 'bg-primary' : ''}
              data-testid={`filter-${status}`}
            >
              {status === 'all' ? 'Tümü' : statusConfig[status].label}
            </Button>
          ))}
        </div>
      </div>

      {/* Quotes List */}
      {filteredQuotes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500 mb-4">
              {searchQuery || statusFilter !== 'all'
                ? 'Filtreyle eşleşen teklif bulunamadı'
                : 'Henüz teklif oluşturulmadı'}
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <Link to="/quotes/new">
                <Button data-testid="create-first-quote-btn">
                  <Plus className="w-4 h-4 mr-2" />
                  İlk Teklifinizi Oluşturun
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredQuotes.map((quote) => {
            const status = statusConfig[quote.status] || statusConfig.draft;
            const StatusIcon = status.icon;
            return (
              <Card key={quote.id} className="card-hover" data-testid={`quote-card-${quote.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Status Icon */}
                    <div className={`w-12 h-12 rounded-lg ${status.bg} flex items-center justify-center flex-shrink-0`}>
                      <StatusIcon className={`w-6 h-6 ${status.color}`} />
                    </div>

                    {/* Main Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-900">{quote.customer_name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${status.bg} ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-500">
                        <span className="font-mono">{quote.quote_number}</span>
                        <span>•</span>
                        <span>{formatDate(quote.created_at)}</span>
                        <span>•</span>
                        <span>{quote.items.length} kalem</span>
                      </div>
                    </div>

                    {/* Total */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-xl font-bold font-mono text-slate-900">
                        {formatCurrency(quote.total)}
                      </p>
                      <p className="text-xs text-slate-400">KDV Dahil</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Link to={`/quotes/${quote.id}`}>
                        <Button variant="ghost" size="sm" data-testid={`view-quote-${quote.id}`}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadPdf(quote)}
                        data-testid={`download-quote-${quote.id}`}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" data-testid={`quote-menu-${quote.id}`}>
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleShareWhatsApp(quote)}>
                            <Share2 className="w-4 h-4 mr-2" />
                            WhatsApp ile Paylaş
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleShareEmail(quote)}>
                            <Mail className="w-4 h-4 mr-2" />
                            E-posta ile Gönder
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(quote, 'accepted')}>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Kabul Edildi
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(quote, 'rejected')}>
                            <XCircle className="w-4 h-4 mr-2" />
                            Reddedildi
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(quote)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Sil
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Quotes;
