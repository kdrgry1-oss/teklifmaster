# QuoteMaster Pro - PRD (Product Requirements Document)

## Proje Özeti
KOBİ ve freelancerların ürün kataloglarını yönetebildiği, Excel ile toplu fiyat güncelleyebildiği ve saniyeler içinde kurumsal PDF teklifleri oluşturup WhatsApp/Email üzerinden paylaşabildiği bulut tabanlı bir SaaS platformu.

## Kullanıcı Personaları
1. **KOBİ Satış Temsilcisi**: Günlük 5-10 teklif hazırlayan, müşterilere hızlı dönüş yapmak isteyen profesyonel
2. **Freelancer/Danışman**: Hizmet bazlı teklifler hazırlayan bağımsız çalışan
3. **Şirket Sahibi**: Teklif süreçlerini takip eden ve raporlara ihtiyaç duyan karar verici

## Temel Gereksinimler (Statik)
- Kullanıcı kimlik doğrulama (JWT tabanlı)
- 7 günlük ücretsiz deneme süresi
- Ürün kataloğu yönetimi (CRUD, görsel, birim, KDV, fiyat)
- Excel ile toplu import/export
- Banka hesabı/IBAN yönetimi
- Profesyonel PDF teklif oluşturma
- WhatsApp Web ve Email ile paylaşım
- Abonelik sistemi (Iyzico entegrasyonu)

## Uygulanan Özellikler (14-15 Ocak 2025)

### Backend (FastAPI + MongoDB)
- [x] JWT tabanlı kullanıcı kimlik doğrulama (register/login)
- [x] **Şifre Sıfırlama** (/api/auth/forgot-password, /api/auth/reset-password) ✓ NEW
- [x] Kullanıcı profili ve şirket bilgileri yönetimi
- [x] Logo yükleme (Base64) + **PDF'e logo ekleme** ✓ NEW
- [x] Ürün CRUD API'leri + **görsel yükleme**
- [x] **Excel import/export** + **Şablon indirme** (/api/products/template/excel) ✓ NEW
- [x] Banka hesabı CRUD API'leri
- [x] **Müşteri CRUD API'leri** (search destekli)
- [x] Teklif oluşturma/listeleme/detay API'leri
- [x] **Teklif düzenleme (PUT /api/quotes/{id})**
- [x] **Genel İskonto** (% ve TL bazlı) ✓ NEW
- [x] **Müşteri vergi numarası desteği**
- [x] Teklif hesaplama (satır iskonto, KDV dahil/hariç)
- [x] **PDF Şablon Sistemi** (5 farklı şablon: Klasik, Modern, Profesyonel, Zarif, Okyanus)
- [x] **Gelişmiş PDF Ayarları** (görsel göster/gizle, boyut, açıklama uzunluğu) ✓ NEW
- [x] PDF teklif oluşturma (ReportLab ile) + **vergi no gösterimi**
- [x] **Email ile Teklif Paylaşımı** (Resend entegrasyonu) ✓ NEW
- [x] Dashboard istatistikleri API
- [x] **Rapor API'si** (tarih aralığı, dönüşüm oranı, ciro analizi)
- [x] Iyzico abonelik mock entegrasyonu

### Frontend (React + Tailwind + shadcn/ui)
- [x] Login/Register sayfası (split-screen tasarım)
- [x] **Şifremi Unuttum sayfası** (/forgot-password) ✓ NEW
- [x] **Şifre Sıfırlama sayfası** (/reset-password) ✓ NEW
- [x] Dashboard (Bento grid, özet metrikler, son teklifler)
- [x] Ürün Kataloğu (grid görünüm, arama, CRUD modali, **görsel yükleme**)
- [x] **Excel Import/Export + Şablon İndirme Butonları** ✓ NEW
- [x] **Müşteriler sayfası** (CRUD, arama - isim/email/VKN)
- [x] Teklifler listesi (filtreleme, durum badge'leri)
- [x] Yeni Teklif oluşturma (**müşteri seçimi**, vergi no, **çoklu ürün seçimi/arama**)
- [x] **Genel İskonto UI** (% ve TL seçimi) ✓ NEW
- [x] **Teklif düzenleme** (/quotes/:id/edit)
- [x] Teklif detay sayfası (PDF indirme, **Email dialog**, **WhatsApp paylaşımı**)
- [x] **Raporlar sayfası** (tarih aralığı, teklif sayıları, dönüşüm oranı, ciro, top müşteriler)
- [x] Banka Hesapları yönetimi
- [x] **Şirket Ayarları sayfası** (logo yükleme + **PDF şablon seçimi** + **PDF Detay Ayarları**) ✓ NEW
- [x] Abonelik sayfası (mock ödeme formu)
- [x] Responsive sidebar navigasyon
- [x] Türkçe arayüz

## Önceliklendirilmiş Backlog

### P0 (Kritik - Sonraki Sprint)
- [ ] Gerçek Iyzico API entegrasyonu
- [ ] Resend API key yapılandırması (email gönderimi aktif hale getirilecek)

### P1 (Yüksek Öncelik)
- [x] ~~Ürün görseli yükleme~~ ✓
- [x] ~~Teklif düzenleme özelliği~~ ✓
- [x] ~~Müşteri veritabanı~~ ✓
- [x] ~~Teklif şablonları~~ ✓ (5 farklı PDF şablonu)
- [x] ~~PDF'e şirket logosu ekleme~~ ✓
- [x] ~~Şifre sıfırlama~~ ✓
- [x] ~~WhatsApp/Email ile teklif paylaşımı~~ ✓
- [x] ~~Genel iskonto (% ve TL)~~ ✓
- [x] ~~Gelişmiş PDF ayarları~~ ✓
- [x] ~~Excel şablon indirme~~ ✓

### P2 (Orta Öncelik)
- [x] ~~Raporlama ve analitik dashboard~~ ✓
- [ ] Çoklu para birimi desteği (döviz kuru API)
- [ ] Teklif revizyon geçmişi
- [ ] E-imza entegrasyonu

### P3 (Düşük Öncelik)
- [ ] Mobil uygulama
- [ ] API erişimi (3. taraf entegrasyonlar)
- [ ] Çoklu kullanıcı/ekip desteği

## Teknik Mimari
- **Frontend**: React 19, Tailwind CSS, shadcn/ui, Axios
- **Backend**: FastAPI, Motor (async MongoDB), Pydantic
- **Database**: MongoDB
- **PDF Engine**: ReportLab
- **Auth**: JWT (PyJWT, bcrypt)
- **Security**: Cryptography (Fernet), Rate Limiting, XSS Protection
- **Payment**: Iyzico (mock - gerçek entegrasyon bekliyor)

## Güvenlik Özellikleri (15 Ocak 2025)
- ✅ **Rate Limiting**: 60 istek/dakika limiti
- ✅ **Brute Force Koruması**: 5 başarısız giriş → 15 dakika IP bloklama
- ✅ **XSS Koruması**: HTML escape + regex pattern filtreleme
- ✅ **Secure Headers**: X-Frame-Options (DENY), X-Content-Type-Options, X-XSS-Protection
- ✅ **Input Validation**: Ürün, müşteri, IBAN doğrulama
- ✅ **Audit Logging**: Kritik işlemlerin kaydı
- ✅ **Data Encryption**: Hassas veriler için Fernet şifreleme hazır

## Sonraki Adımlar
1. ~~Iyzico gerçek entegrasyon~~ ✅ TAMAMLANDI (3D Secure destekli)
2. Kullanıcı testleri ve geri bildirim toplama

## Test Sonuçları (15 Ocak 2025)
- **PDF Şablon Seçimi**: ✅ 13/13 test geçti
- **Excel Import/Export**: ✅ Tüm testler geçti
- **Yeni Özellikler (iteration_4)**: ✅ 11/11 test geçti (%100)
- **Güvenlik Testleri (iteration_5)**: ✅ 20/20 test geçti (%100)
- **Iyzico Entegrasyonu**: ✅ 3D Secure çalışıyor
- **Test Raporları**: /app/test_reports/iteration_3.json, /app/test_reports/iteration_4.json, /app/test_reports/iteration_5.json

## MOCKED API'ler
- ~~**Iyzico Abonelik**: Şu an mock, gerçek ödeme yapılmıyor~~ ✅ GERÇEK ENTEGRASYON TAMAMLANDI
- **Email Gönderimi**: Basitleştirildi - mailto: kullanılıyor (PDF önce indirilir)
