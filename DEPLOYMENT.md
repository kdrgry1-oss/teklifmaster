# TeklifMaster.com Deployment Rehberi

## Gerekli Sunucu Özellikleri

### Minimum Sunucu Gereksinimleri
- **RAM**: 2 GB (önerilen 4 GB)
- **CPU**: 2 vCPU
- **Disk**: 20 GB SSD
- **OS**: Ubuntu 22.04 LTS

### Önerilen Cloud Sağlayıcılar
1. **DigitalOcean** - Droplet ($12-24/ay)
2. **Hetzner** - VPS (€4-8/ay) - Ekonomik seçenek
3. **AWS Lightsail** ($10-20/ay)
4. **Contabo** - VPS (€4-6/ay) - En ekonomik

---

## Kurulum Adımları

### 1. Sunucu Hazırlığı

```bash
# Sunucuya SSH ile bağlan
ssh root@sunucu-ip

# Sistem güncellemesi
apt update && apt upgrade -y

# Gerekli paketleri yükle
apt install -y python3.11 python3.11-venv python3-pip nodejs npm nginx certbot python3-certbot-nginx git

# MongoDB kurulumu
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
apt update
apt install -y mongodb-org
systemctl start mongod
systemctl enable mongod
```

### 2. Uygulama Dosyalarını Yükle

```bash
# Uygulama dizini oluştur
mkdir -p /var/www/teklifmaster
cd /var/www/teklifmaster

# Dosyaları kopyala (scp veya git ile)
# Örnek: scp -r /app/* root@sunucu-ip:/var/www/teklifmaster/
```

### 3. Backend Kurulumu

```bash
cd /var/www/teklifmaster/backend

# Virtual environment oluştur
python3.11 -m venv venv
source venv/bin/activate

# Paketleri yükle
pip install -r requirements.txt

# .env dosyasını düzenle
nano .env
```

**.env dosyası içeriği:**
```env
MONGO_URL="mongodb://localhost:27017"
DB_NAME="quotemaster_prod"
CORS_ORIGINS="https://teklifmaster.com,https://www.teklifmaster.com"
FRONTEND_URL=https://teklifmaster.com
IYZICO_API_KEY=NsgG18dIgsLOChdzb7zvSw9RfSKUGdGF
IYZICO_SECRET_KEY=SoWGW5mF0woFhdcXNCxiYAlyiwYYgjb8
IYZICO_BASE_URL=api.iyzipay.com
JWT_SECRET=GUCLU-BIR-SECRET-KEY-OLUSTURUN-32-KARAKTER
```

### 4. Frontend Build

```bash
cd /var/www/teklifmaster/frontend

# Node modules yükle
npm install --legacy-peer-deps
# veya
yarn install

# .env dosyasını düzenle
echo "REACT_APP_BACKEND_URL=https://teklifmaster.com" > .env

# Production build
npm run build
# veya
yarn build
```

### 5. Systemd Service Dosyası (Backend)

```bash
nano /etc/systemd/system/teklifmaster.service
```

İçerik:
```ini
[Unit]
Description=TeklifMaster Backend API
After=network.target mongod.service

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/teklifmaster/backend
Environment="PATH=/var/www/teklifmaster/backend/venv/bin"
ExecStart=/var/www/teklifmaster/backend/venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Servisi aktifleştir
systemctl daemon-reload
systemctl enable teklifmaster
systemctl start teklifmaster
```

### 6. Nginx Yapılandırması

```bash
nano /etc/nginx/sites-available/teklifmaster
```

İçerik:
```nginx
server {
    listen 80;
    server_name teklifmaster.com www.teklifmaster.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name teklifmaster.com www.teklifmaster.com;

    # SSL sertifikaları (certbot ile oluşturulacak)
    ssl_certificate /etc/letsencrypt/live/teklifmaster.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/teklifmaster.com/privkey.pem;

    # SSL güvenlik ayarları
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    # Güvenlik başlıkları
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Frontend (React build)
    root /var/www/teklifmaster/frontend/build;
    index index.html;

    # API isteklerini backend'e yönlendir
    location /api {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }

    # Frontend routing (React Router)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Statik dosyalar için cache
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# Nginx yapılandırmasını aktifleştir
ln -s /etc/nginx/sites-available/teklifmaster /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### 7. SSL Sertifikası (Let's Encrypt)

```bash
# Önce DNS'i ayarla: teklifmaster.com -> sunucu IP
# Sonra certbot çalıştır
certbot --nginx -d teklifmaster.com -d www.teklifmaster.com
```

---

## Iyzico Ayarları (ÖNEMLİ!)

Iyzico panelinde şu ayarları yapmanız gerekiyor:

1. **Iyzico Merchant Panel**'e giriş yapın: https://merchant.iyzipay.com
2. **Ayarlar > Güvenlik Ayarları** bölümüne gidin
3. **İzin Verilen Domain'ler** kısmına ekleyin:
   - `https://teklifmaster.com`
   - `https://www.teklifmaster.com`
4. **Callback URL** olarak ekleyin:
   - `https://teklifmaster.com/api/subscription/callback`

---

## Güncellemeler

```bash
# Uygulama güncelleme
cd /var/www/teklifmaster
git pull origin main  # veya dosyaları scp ile kopyala

# Backend restart
systemctl restart teklifmaster

# Frontend rebuild
cd frontend
npm run build
```

---

## Sorun Giderme

### Logları kontrol et
```bash
# Backend logları
journalctl -u teklifmaster -f

# Nginx logları
tail -f /var/log/nginx/error.log

# MongoDB logları
tail -f /var/log/mongodb/mongod.log
```

### Servislerin durumu
```bash
systemctl status teklifmaster
systemctl status nginx
systemctl status mongod
```

---

## Yedekleme

```bash
# MongoDB yedekleme
mongodump --db quotemaster_prod --out /backup/$(date +%Y%m%d)

# Otomatik yedekleme için cron job
crontab -e
# Ekle: 0 3 * * * mongodump --db quotemaster_prod --out /backup/$(date +\%Y\%m\%d)
```

---

## Önemli Notlar

1. **JWT_SECRET**: Production için güçlü, rastgele bir key oluşturun:
   ```bash
   openssl rand -hex 32
   ```

2. **Firewall**: Sadece gerekli portları açın (80, 443, 22)
   ```bash
   ufw allow 80
   ufw allow 443
   ufw allow 22
   ufw enable
   ```

3. **MongoDB Güvenliği**: Production'da authentication aktif edin

4. **Düzenli Yedekleme**: Otomatik yedekleme sistemi kurun

5. **Monitoring**: Uptime monitoring servisi kullanın (UptimeRobot ücretsiz)
