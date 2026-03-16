# TeklifMaster Pro - PRD (Product Requirements Document)

## Proje Özeti
KOBİ ve freelancerların ürün kataloglarını yönetebildiği, Excel ile toplu fiyat güncelleyebildiği ve saniyeler içinde kurumsal PDF teklifleri oluşturup WhatsApp/Email üzerinden paylaşabildiği bulut tabanlı bir SaaS platformu.

**Domain**: teklifmaster.com

## Kullanıcı Personaları
1. **KOBİ Satış Temsilcisi**: Günlük 5-10 teklif hazırlayan, müşterilere hızlı dönüş yapmak isteyen profesyonel
2. **Freelancer/Danışman**: Hizmet bazlı teklifler hazırlayan bağımsız çalışan
3. **Şirket Sahibi**: Teklif süreçlerini takip eden ve raporlara ihtiyaç duyan karar verici

## Temel Gereksinimler (Statik)
- Kullanıcı kimlik doğrulama (JWT tabanlı)
- 7 günlük ücretsiz deneme süresi (satın alma sonrasında da geçerli)
- Ürün kataloğu yönetimi (CRUD, görsel, birim, KDV, fiyat)
- Excel ile toplu import/export
- Banka hesabı/IBAN yönetimi
- Profesyonel PDF teklif oluşturma
- WhatsApp Web ve Email ile paylaşım
- Abonelik sistemi (Iyzico entegrasyonu)
- iOS/Android mobil uygulama

## Uygulanan Özellikler

### Backend (FastAPI + MongoDB)
- [x] JWT tabanlı kullanıcı kimlik doğrulama (register/login)
- [x] Şifre Sıfırlama (SMTP ile)
- [x] Kullanıcı profili ve şirket bilgileri yönetimi
- [x] Logo yükleme (Base64) + PDF'e logo ekleme
- [x] Ürün CRUD API'leri + görsel yükleme + görsel URL desteği
- [x] Excel import/export + Şablon indirme
- [x] Banka hesabı CRUD API'leri
- [x] Müşteri CRUD API'leri (search destekli)
- [x] Teklif oluşturma/listeleme/detay API'leri
- [x] Teklif düzenleme (PUT /api/quotes/{id})
- [x] Genel İskonto (% ve TL bazlı)
- [x] Müşteri vergi numarası desteği
- [x] **PDF Türkçe Karakter Desteği** (TurkishFont) ✓ YENİ
- [x] **PDF'de Ürün Görselleri** ✓ YENİ
- [x] PDF Şablon Sistemi (5 farklı şablon)
- [x] Gelişmiş PDF Ayarları (görsel göster/gizle, boyut, açıklama uzunluğu)
- [x] Dashboard istatistikleri API
- [x] Rapor API'si (tarih aralığı, dönüşüm oranı, ciro analizi)
- [x] **Iyzico 3D Secure Entegrasyonu** (Canlı)
- [x] **7 Günlük Deneme Süresi** (satın alma sonrası otomatik tanımlama) ✓ YENİ
- [x] **Admin Paneli API'leri** (kullanıcı yönetimi, kupon, kampanya, fraud)
- [x] **Kupon Sistemi** (% ve TL indirim)
- [x] **Dolandırıcılık Önleme** (IP, fingerprint, telefon kontrolü)
- [x] **Toplu Email Kampanyası** (SMTP)

### Frontend (React + Tailwind + shadcn/ui)
- [x] Login/Register sayfası
- [x] Şifremi Unuttum sayfası
- [x] Dashboard (Bento grid, özet metrikler, son teklifler)
- [x] Ürün Kataloğu (grid görünüm, arama, CRUD, görsel yükleme, **ürün klonlama**)
- [x] Excel Import/Export + Şablon İndirme
- [x] Müşteriler sayfası (CRUD, arama)
- [x] Teklifler listesi (filtreleme, durum badge'leri)
- [x] Yeni Teklif oluşturma (zorunlu teklif adı, müşteri seçimi, çoklu ürün seçimi)
- [x] Genel İskonto UI (% ve TL seçimi)
- [x] Teklif düzenleme
- [x] Teklif detay sayfası (PDF indirme, Email, WhatsApp paylaşımı)
- [x] Raporlar sayfası
- [x] Banka Hesapları yönetimi
- [x] Şirket Ayarları sayfası (logo, PDF şablon, PDF ayarları)
- [x] **Abonelik sayfası** (aylık ₺299, yıllık ₺2990, kupon desteği)
- [x] **Admin Paneli** (kullanıcı/kupon/kampanya/fraud yönetimi)
- [x] **Landing Page** (TeklifMaster markalı)
- [x] **Kullanım Sözleşmesi** sayfası
- [x] Responsive sidebar navigasyon
- [x] Türkçe arayüz

### Mobil Uygulama (React Native + Expo) ✓ YENİ
- [x] Login/Register ekranı (sözleşme onayı dahil)
- [x] Dashboard (istatistikler, hızlı işlemler)
- [x] Teklifler listesi ve detay
- [x] Yeni Teklif oluşturma
- [x] PDF indirme ve paylaşma
- [x] Müşteriler yönetimi
- [x] Ürünler/Hizmetler yönetimi
- [x] Profil ve abonelik durumu
- [x] Ayarlar ekranı
- [x] Bottom tab navigation

## Önceliklendirilmiş Backlog

### P0 (Kritik - Tamamlandı)
- [x] ~~Gerçek Iyzico API entegrasyonu~~ ✓
- [x] ~~PDF Türkçe karakter düzeltmesi~~ ✓
- [x] ~~Mobil uygulama temel yapısı~~ ✓

### P1 (Yüksek Öncelik)
- [ ] Mobil uygulama testleri ve App Store/Play Store yayını
- [ ] PDF'de ürün görseli testleri (canlı ortam)

### P2 (Orta Öncelik)
- [ ] Çoklu para birimi desteği (döviz kuru API)
- [ ] Teklif revizyon geçmişi
- [ ] E-imza entegrasyonu

### P3 (Düşük Öncelik)
- [ ] API erişimi (3. taraf entegrasyonlar)
- [ ] Çoklu kullanıcı/ekip desteği

## Teknik Mimari
- **Frontend**: React 19, Tailwind CSS, shadcn/ui, Axios
- **Backend**: FastAPI, Motor (async MongoDB), Pydantic
- **Database**: MongoDB
- **PDF Engine**: ReportLab + DejaVu/Liberation fonts
- **Auth**: JWT (PyJWT, bcrypt)
- **Security**: Cryptography (Fernet), Rate Limiting, XSS Protection, Fingerprinting
- **Payment**: Iyzico (3D Secure - Canlı)
- **Mobile**: React Native, Expo, React Navigation
- **Email**: SMTP (Hostinger)

## Güvenlik Özellikleri
- ✅ Rate Limiting: 60 istek/dakika limiti
- ✅ Brute Force Koruması: 5 başarısız giriş → 15 dakika IP bloklama
- ✅ XSS Koruması: HTML escape + regex pattern filtreleme
- ✅ Secure Headers
- ✅ Input Validation
- ✅ Audit Logging
- ✅ Data Encryption: Fernet şifreleme
- ✅ Anti-Fraud: IP logging, fingerprint, telefon/şirket adı kontrolü

## Fiyatlandırma
- Aylık: ₺299
- Yıllık: ₺2990 (2 ay tasarruf)
- 7 günlük ücretsiz deneme (herkes için)

## Dosya Yapısı
```
/app/
├── backend/
│   ├── .env
│   ├── server.py         # Ana FastAPI uygulama (3000+ satır)
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── api.js
│       ├── App.js
│       ├── components/
│       │   └── layout/
│       │       ├── Landing.jsx
│       │       └── Layout.jsx
│       └── pages/
│           ├── AdminPanel.jsx
│           ├── NewQuote.jsx
│           ├── Products.jsx
│           ├── Subscription.jsx
│           └── Terms.jsx
├── mobile/               # React Native mobil uygulama
│   ├── App.js
│   ├── package.json
│   └── src/
│       ├── config.js
│       ├── context/AuthContext.js
│       ├── navigation/RootNavigator.js
│       ├── screens/
│       │   ├── LoginScreen.js
│       │   ├── DashboardScreen.js
│       │   ├── QuotesScreen.js
│       │   ├── QuoteDetailScreen.js
│       │   ├── NewQuoteScreen.js
│       │   ├── CustomersScreen.js
│       │   ├── CustomerDetailScreen.js
│       │   ├── ProductsScreen.js
│       │   ├── ProductDetailScreen.js
│       │   ├── ProfileScreen.js
│       │   └── SettingsScreen.js
│       └── services/api.js
└── docker-compose.yml
```

## Son Güncelleme: Aralık 2025
- PDF Türkçe karakter desteği düzeltildi (ş, ğ, ı, ü, ö, ç)
- PDF'de ürün görselleri gösterme özelliği eklendi
- 7 günlük deneme süresi satın alma sonrası da tanımlanıyor
- React Native mobil uygulama geliştirildi (iOS/Android)
