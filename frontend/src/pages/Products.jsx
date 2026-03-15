import React, { useState, useEffect, useRef } from 'react';
import { productsAPI, formatCurrency } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Skeleton } from '../components/ui/skeleton';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Download,
  Upload,
  Package,
  Loader2,
  Image as ImageIcon,
  Copy,
} from 'lucide-react';

const UNITS = [
  { value: 'adet', label: 'Adet' },
  { value: 'm', label: 'Metre' },
  { value: 'm2', label: 'Metrekare' },
  { value: 'kg', label: 'Kilogram' },
  { value: 'lt', label: 'Litre' },
  { value: 'saat', label: 'Saat' },
  { value: 'gun', label: 'Gün' },
  { value: 'ay', label: 'Ay' },
  { value: 'paket', label: 'Paket' },
];

const VAT_RATES = [0, 1, 10, 20];

const CURRENCIES = [
  { value: 'TRY', label: '₺ TL', symbol: '₺' },
  { value: 'USD', label: '$ USD', symbol: '$' },
  { value: 'EUR', label: '€ EUR', symbol: '€' },
  { value: 'GBP', label: '£ GBP', symbol: '£' },
];

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    unit: 'adet',
    unit_price: '',
    currency: 'TRY',
    vat_rate: 20,
    image_url: '',
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await productsAPI.getAll();
      setProducts(response.data);
    } catch (error) {
      toast.error('Ürünler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description || '',
        sku: product.sku || '',
        unit: product.unit,
        unit_price: product.unit_price.toString(),
        currency: product.currency || 'TRY',
        vat_rate: product.vat_rate,
        image_url: product.image_url || '',
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        sku: '',
        unit: 'adet',
        unit_price: '',
        currency: 'TRY',
        vat_rate: 20,
        image_url: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.unit_price) {
      toast.error('Ürün adı ve birim fiyat zorunludur');
      return;
    }

    setSaving(true);
    try {
      const data = {
        ...formData,
        unit_price: parseFloat(formData.unit_price),
        vat_rate: parseFloat(formData.vat_rate),
      };

      if (editingProduct) {
        await productsAPI.update(editingProduct.id, data);
        toast.success('Ürün güncellendi');
      } else {
        await productsAPI.create(data);
        toast.success('Ürün eklendi');
      }

      setDialogOpen(false);
      fetchProducts();
    } catch (error) {
      toast.error('İşlem başarısız');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`"${product.name}" ürününü silmek istediğinize emin misiniz?`)) {
      return;
    }

    try {
      await productsAPI.delete(product.id);
      toast.success('Ürün silindi');
      fetchProducts();
    } catch (error) {
      toast.error('Ürün silinemedi');
    }
  };

  const handleClone = async (product) => {
    try {
      const clonedData = {
        name: `${product.name} (Kopya)`,
        description: product.description || '',
        sku: product.sku ? `${product.sku}-KOPYA` : '',
        unit: product.unit,
        price: product.price,
        vat_rate: product.vat_rate,
        currency: product.currency || 'TRY',
        category: product.category || '',
        image_url: product.image_url || '',
      };
      await productsAPI.create(clonedData);
      toast.success('Ürün klonlandı');
      fetchProducts();
    } catch (error) {
      toast.error('Ürün klonlanamadı');
    }
  };

  const handleExport = async () => {
    try {
      const response = await productsAPI.exportExcel();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'urunler.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Excel dosyası indirildi');
    } catch (error) {
      toast.error('Dışa aktarma başarısız');
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await productsAPI.downloadTemplate();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'quotemaster_urun_sablonu.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Şablon indirildi');
    } catch (error) {
      toast.error('Şablon indirilemedi');
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const response = await productsAPI.importExcel(file);
      toast.success(`${response.data.imported} ürün eklendi, ${response.data.updated} ürün güncellendi`);
      fetchProducts();
    } catch (error) {
      toast.error('İçe aktarma başarısız');
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Görsel 2MB\'dan küçük olmalıdır');
      return;
    }

    if (editingProduct) {
      // Upload to server for existing product
      setUploadingImage(true);
      try {
        const response = await productsAPI.uploadImage(editingProduct.id, file);
        setFormData({ ...formData, image_url: response.data.image_url });
        toast.success('Görsel yüklendi');
        fetchProducts();
      } catch (error) {
        toast.error('Görsel yüklenemedi');
      } finally {
        setUploadingImage(false);
      }
    } else {
      // Convert to base64 for new product
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData({ ...formData, image_url: event.target.result });
      };
      reader.readAsDataURL(file);
    }

    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6" data-testid="products-loading">
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
    <div className="space-y-6 animate-fade-in" data-testid="products-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ürün / Hizmet Kataloğu</h1>
          <p className="text-slate-500">{products.length} ürün</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={handleDownloadTemplate} data-testid="download-template-btn">
            <Download className="w-4 h-4 mr-2" />
            Şablon
          </Button>
          <Button variant="outline" onClick={handleExport} data-testid="export-btn">
            <Download className="w-4 h-4 mr-2" />
            Excel
          </Button>
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            data-testid="import-btn"
          >
            {importing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            İçe Aktar
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleImport}
          />
          <Button className="btn-accent" onClick={() => handleOpenDialog()} data-testid="add-product-btn">
            <Plus className="w-4 h-4 mr-2" />
            Ürün / Hizmet Ekle
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Ürün ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          data-testid="product-search"
        />
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500 mb-4">
              {searchQuery ? 'Aramanızla eşleşen ürün bulunamadı' : 'Henüz ürün eklenmedi'}
            </p>
            {!searchQuery && (
              <Button onClick={() => handleOpenDialog()} data-testid="add-first-product-btn">
                <Plus className="w-4 h-4 mr-2" />
                İlk Ürününüzü Ekleyin
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="card-hover" data-testid={`product-card-${product.id}`}>
              <CardContent className="p-4">
                <div className="flex gap-3">
                  {/* Product Image */}
                  <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="w-8 h-8 text-slate-300" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-slate-900 truncate">{product.name}</h3>
                        {product.sku && (
                          <p className="text-xs text-slate-400 font-mono">{product.sku}</p>
                        )}
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleClone(product)}
                          title="Klonla"
                          data-testid={`clone-product-${product.id}`}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(product)}
                          data-testid={`edit-product-${product.id}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(product)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          data-testid={`delete-product-${product.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    {product.description && (
                      <p className="text-sm text-slate-500 mt-1 line-clamp-1">{product.description}</p>
                    )}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                      <div className="text-xs text-slate-500">
                        {product.unit} • %{product.vat_rate} KDV
                      </div>
                      <div className="font-semibold font-mono text-slate-900">
                        {CURRENCIES.find(c => c.value === product.currency)?.symbol || '₺'}
                        {product.unit_price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Product Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg" data-testid="product-dialog">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Ürün / Hizmet Düzenle' : 'Yeni Ürün / Hizmet'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Image Upload */}
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-dashed border-slate-200">
                {formData.image_url ? (
                  <img
                    src={formData.image_url}
                    alt="Ürün"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="w-8 h-8 text-slate-300" />
                )}
              </div>
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={uploadingImage}
                  data-testid="upload-image-btn"
                >
                  {uploadingImage ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  Görsel Yükle
                </Button>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <p className="text-xs text-slate-400 mt-1">PNG, JPG. Max 2MB</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="name">Ürün Adı *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ürün adı"
                  data-testid="product-name-input"
                />
              </div>
              <div>
                <Label htmlFor="sku">SKU / Stok Kodu</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="PRD-001"
                  data-testid="product-sku-input"
                />
              </div>
              <div>
                <Label htmlFor="unit">Birim</Label>
                <Select
                  value={formData.unit}
                  onValueChange={(value) => setFormData({ ...formData, unit: value })}
                >
                  <SelectTrigger data-testid="product-unit-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => (
                      <SelectItem key={u.value} value={u.value}>
                        {u.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="unit_price">Birim Fiyat *</Label>
                <Input
                  id="unit_price"
                  type="number"
                  step="0.01"
                  value={formData.unit_price}
                  onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                  placeholder="0.00"
                  className="text-right font-mono"
                  data-testid="product-price-input"
                />
              </div>
              <div>
                <Label htmlFor="currency">Para Birimi</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => setFormData({ ...formData, currency: value })}
                >
                  <SelectTrigger data-testid="product-currency-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="vat_rate">KDV Oranı (%)</Label>
                <Select
                  value={formData.vat_rate.toString()}
                  onValueChange={(value) => setFormData({ ...formData, vat_rate: parseInt(value) })}
                >
                  <SelectTrigger data-testid="product-vat-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VAT_RATES.map((rate) => (
                      <SelectItem key={rate} value={rate.toString()}>
                        %{rate}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label htmlFor="description">Açıklama</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ürün açıklaması (opsiyonel)"
                  data-testid="product-description-input"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleSave} disabled={saving} className="btn-accent" data-testid="save-product-btn">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Kaydediliyor...
                </>
              ) : editingProduct ? (
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

export default Products;
