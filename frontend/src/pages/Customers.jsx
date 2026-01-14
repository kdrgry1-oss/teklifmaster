import React, { useState, useEffect } from 'react';
import { customersAPI } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Skeleton } from '../components/ui/skeleton';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Users,
  Loader2,
  Building,
  Mail,
  Phone,
  MapPin,
  FileText,
} from 'lucide-react';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    tax_number: '',
    contact_person: '',
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async (search = '') => {
    try {
      const response = await customersAPI.getAll(search);
      setCustomers(response.data);
    } catch (error) {
      toast.error('Müşteriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearchQuery(value);
    fetchCustomers(value);
  };

  const handleOpenDialog = (customer = null) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        name: customer.name,
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
        tax_number: customer.tax_number || '',
        contact_person: customer.contact_person || '',
      });
    } else {
      setEditingCustomer(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        tax_number: '',
        contact_person: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.error('Müşteri/Firma adı zorunludur');
      return;
    }

    setSaving(true);
    try {
      if (editingCustomer) {
        await customersAPI.update(editingCustomer.id, formData);
        toast.success('Müşteri güncellendi');
      } else {
        await customersAPI.create(formData);
        toast.success('Müşteri eklendi');
      }

      setDialogOpen(false);
      fetchCustomers(searchQuery);
    } catch (error) {
      toast.error('İşlem başarısız');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (customer) => {
    if (!window.confirm(`"${customer.name}" müşterisini silmek istediğinize emin misiniz?`)) {
      return;
    }

    try {
      await customersAPI.delete(customer.id);
      toast.success('Müşteri silindi');
      fetchCustomers(searchQuery);
    } catch (error) {
      toast.error('Müşteri silinemedi');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6" data-testid="customers-loading">
        <div className="flex justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="customers-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Müşteriler</h1>
          <p className="text-slate-500">{customers.length} müşteri</p>
        </div>
        <Button className="btn-accent" onClick={() => handleOpenDialog()} data-testid="add-customer-btn">
          <Plus className="w-4 h-4 mr-2" />
          Müşteri Ekle
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Müşteri, email veya VKN ara..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10"
          data-testid="customer-search"
        />
      </div>

      {/* Customers Grid */}
      {customers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500 mb-4">
              {searchQuery ? 'Aramanızla eşleşen müşteri bulunamadı' : 'Henüz müşteri eklenmedi'}
            </p>
            {!searchQuery && (
              <Button onClick={() => handleOpenDialog()} data-testid="add-first-customer-btn">
                <Plus className="w-4 h-4 mr-2" />
                İlk Müşterinizi Ekleyin
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map((customer) => (
            <Card key={customer.id} className="card-hover" data-testid={`customer-card-${customer.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Building className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-900 truncate">{customer.name}</h3>
                      {customer.tax_number && (
                        <p className="text-xs text-slate-400 font-mono">VKN: {customer.tax_number}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDialog(customer)}
                      data-testid={`edit-customer-${customer.id}`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(customer)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      data-testid={`delete-customer-${customer.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1 text-sm text-slate-500">
                  {customer.contact_person && (
                    <div className="flex items-center gap-2">
                      <Users className="w-3 h-3" />
                      <span className="truncate">{customer.contact_person}</span>
                    </div>
                  )}
                  {customer.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3 h-3" />
                      <span className="truncate">{customer.email}</span>
                    </div>
                  )}
                  {customer.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3 h-3" />
                      <span>{customer.phone}</span>
                    </div>
                  )}
                  {customer.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{customer.address}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Customer Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg" data-testid="customer-dialog">
          <DialogHeader>
            <DialogTitle>{editingCustomer ? 'Müşteri Düzenle' : 'Yeni Müşteri'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">Müşteri / Firma Adı *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Firma adı"
                data-testid="customer-name-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tax_number">Vergi Numarası</Label>
                <Input
                  id="tax_number"
                  value={formData.tax_number}
                  onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })}
                  placeholder="0000000000"
                  className="font-mono"
                  data-testid="customer-tax-input"
                />
              </div>
              <div>
                <Label htmlFor="contact_person">Yetkili Kişi</Label>
                <Input
                  id="contact_person"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  placeholder="Ad Soyad"
                  data-testid="customer-contact-input"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">E-posta</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="ornek@sirket.com"
                  data-testid="customer-email-input"
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="0500 000 00 00"
                  data-testid="customer-phone-input"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="address">Adres</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Firma adresi"
                className="min-h-[80px]"
                data-testid="customer-address-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleSave} disabled={saving} className="btn-accent" data-testid="save-customer-btn">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Kaydediliyor...
                </>
              ) : editingCustomer ? (
                'Güncelle'
              ) : (
                'Ekle'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Customers;
