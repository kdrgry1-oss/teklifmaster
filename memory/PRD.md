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

## Uygulanan Özellikler (14 Ocak 2025)

### Backend (FastAPI + MongoDB)
- [x] JWT tabanlı kullanıcı kimlik doğrulama (register/login)
- [x] Kullanıcı profili ve şirket bilgileri yönetimi
- [x] Logo yükleme (Base64)
- [x] Ürün CRUD API'leri
- [x] Excel import/export (/api/products/export/excel, /api/products/import/excel)
- [x] Banka hesabı CRUD API'leri
- [x] Teklif oluşturma/listeleme/detay API'leri
- [x] Teklif hesaplama (satır iskonto, KDV dahil/hariç)
- [x] PDF teklif oluşturma (ReportLab ile)
- [x] Dashboard istatistikleri API
- [x] Iyzico abonelik mock entegrasyonu

### Frontend (React + Tailwind + shadcn/ui)
- [x] Login/Register sayfası (split-screen tasarım)
- [x] Dashboard (Bento grid, özet metrikler, son teklifler)
- [x] Ürün Kataloğu (grid görünüm, arama, CRUD modali)
- [x] Teklifler listesi (filtreleme, durum badge'leri)
- [x] Yeni Teklif oluşturma (split-screen form, ürün seçimi, hesaplama)
- [x] Teklif detay sayfası (PDF indirme, paylaşım butonları)
- [x] Banka Hesapları yönetimi
- [x] Şirket Ayarları sayfası (logo yükleme)
- [x] Abonelik sayfası (mock ödeme formu)
- [x] Responsive sidebar navigasyon
- [x] Türkçe arayüz

## Önceliklendirilmiş Backlog

### P0 (Kritik - Sonraki Sprint)
- [ ] Gerçek Iyzico API entegrasyonu
- [ ] Email ile teklif gönderimi (SMTP yapılandırması)
- [ ] Şifre sıfırlama fonksiyonu

### P1 (Yüksek Öncelik)
- [ ] Ürün görseli yükleme
- [ ] Teklif düzenleme özelliği
- [ ] Müşteri veritabanı
- [ ] Teklif şablonları

### P2 (Orta Öncelik)
- [ ] Raporlama ve analitik dashboard
- [ ] Çoklu para birimi desteği
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
- **Payment**: Iyzico (mock - gerçek entegrasyon bekliyor)

## Sonraki Adımlar
1. Gerçek Iyzico API anahtarları ile abonelik entegrasyonu
2. SMTP yapılandırması ile email gönderimi
3. Kullanıcı testleri ve geri bildirim toplama
