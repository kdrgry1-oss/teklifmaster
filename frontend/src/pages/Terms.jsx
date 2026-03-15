import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { FileText, ArrowLeft } from 'lucide-react';

const Terms = () => {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4" data-testid="terms-page">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Ana Sayfa
            </Button>
          </Link>
        </div>
        
        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <CardTitle className="text-2xl">Kullanıcı Sözleşmesi</CardTitle>
                <p className="text-slate-500 text-sm">Son güncelleme: Mart 2026</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="prose prose-slate max-w-none p-8">
            <h2>1. Taraflar</h2>
            <p>
              Bu Kullanıcı Sözleşmesi ("Sözleşme"), TeklifMaster platformu ("Platform", "Biz", "Bizim") ile 
              Platform'a kayıt olan ve hizmetlerden yararlanan gerçek veya tüzel kişi ("Kullanıcı", "Siz", "Sizin") 
              arasında, Kullanıcı'nın Platform'a üye olması ile yürürlüğe girer.
            </p>

            <h2>2. Hizmetlerin Tanımı</h2>
            <p>
              TeklifMaster, işletmelere teklif oluşturma, müşteri yönetimi ve raporlama hizmetleri sunan 
              çevrimiçi bir platformdur. Platform üzerinden:
            </p>
            <ul>
              <li>Ürün kataloğu oluşturma ve yönetme</li>
              <li>Müşteri bilgilerini kaydetme ve düzenleme</li>
              <li>Profesyonel PDF teklifleri oluşturma</li>
              <li>Teklifleri e-posta ve WhatsApp ile paylaşma</li>
              <li>Satış raporları görüntüleme</li>
            </ul>
            <p>hizmetleri sunulmaktadır.</p>

            <h2>3. Kullanıcı Yükümlülükleri</h2>
            <p>Kullanıcı, Platform'u kullanırken aşağıdaki yükümlülükleri kabul eder:</p>
            <ul>
              <li>Doğru ve güncel bilgiler sağlamak</li>
              <li>Hesap güvenliğini korumak ve şifresini gizli tutmak</li>
              <li>Platform'u yasa dışı amaçlarla kullanmamak</li>
              <li>Üçüncü şahısların haklarını ihlal etmemek</li>
              <li>Platform'un işleyişini bozmaya çalışmamak</li>
            </ul>

            <h2>4. Abonelik ve Ödeme</h2>
            <p>
              Platform'un tam özelliklerinden yararlanmak için ücretli abonelik gerekmektedir. 
              Abonelik ücretleri web sitesinde belirtilen tutarlardır ve değişiklik hakkı saklıdır.
            </p>
            <ul>
              <li>Aylık abonelik: Her ay otomatik olarak yenilenir</li>
              <li>Yıllık abonelik: Her yıl otomatik olarak yenilenir</li>
              <li>7 günlük ücretsiz deneme süresi tüm yeni kullanıcılara sunulur</li>
              <li>Abonelik iptali istediğiniz zaman yapılabilir</li>
            </ul>

            <h2>5. Teklif İbaresi</h2>
            <p className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <strong>Önemli:</strong> Platform üzerinden oluşturulan tüm PDF tekliflerinde 
              "Bu teklif teklifmaster.com'da oluşturuldu" ibaresi yer alacaktır. 
              Kullanıcı, bu ibareyi kabul eder ve tekliflerinde bu ibarenin bulunmasını onaylar.
            </p>

            <h2>6. Gizlilik</h2>
            <p>
              Kullanıcı verilerinin korunması ve işlenmesi hakkında detaylı bilgi için 
              Gizlilik Politikamızı inceleyebilirsiniz. Kısaca:
            </p>
            <ul>
              <li>Verileriniz SSL şifreleme ile korunur</li>
              <li>Kişisel bilgileriniz üçüncü taraflarla paylaşılmaz</li>
              <li>Ödeme bilgileriniz Iyzico güvenli altyapısı ile işlenir</li>
            </ul>

            <h2>7. Fikri Mülkiyet</h2>
            <p>
              Platform'un tüm içeriği, tasarımı, logosu ve yazılımı TeklifMaster'a aittir. 
              Kullanıcı tarafından yüklenen içerikler (ürün bilgileri, logolar vb.) 
              Kullanıcı'nın mülkiyetinde kalır.
            </p>

            <h2>8. Sorumluluk Sınırları</h2>
            <p>
              TeklifMaster, Platform'un kesintisiz veya hatasız çalışacağını garanti etmez. 
              Platform kullanımından doğabilecek doğrudan veya dolaylı zararlardan 
              TeklifMaster sorumlu tutulamaz.
            </p>

            <h2>9. Sözleşme Değişiklikleri</h2>
            <p>
              TeklifMaster, bu sözleşmeyi önceden haber vermeksizin değiştirme hakkını saklı tutar. 
              Değişiklikler Platform üzerinde yayınlandığı tarihte yürürlüğe girer.
            </p>

            <h2>10. Uyuşmazlık Çözümü</h2>
            <p>
              Bu sözleşmeden doğan uyuşmazlıklarda Türkiye Cumhuriyeti kanunları uygulanır ve 
              İstanbul Mahkemeleri yetkilidir.
            </p>

            <h2>11. İletişim</h2>
            <p>
              Sorularınız için <a href="mailto:info@teklifmaster.com" className="text-orange-500 hover:underline">info@teklifmaster.com</a> adresinden 
              bizimle iletişime geçebilirsiniz.
            </p>

            <div className="mt-8 p-4 bg-slate-100 rounded-lg">
              <p className="text-sm text-slate-600">
                Platform'a kayıt olarak ve hizmetlerimizi kullanarak bu sözleşmenin tüm şartlarını 
                okuduğunuzu, anladığınızı ve kabul ettiğinizi beyan etmiş olursunuz.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Terms;
