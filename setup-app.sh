#!/bin/bash

# TeklifMaster.com Uygulama Kurulum Scripti
# Bu script uygulama dosyaları yüklendikten sonra çalıştırılır

set -e

DOMAIN="teklifmaster.com"
APP_DIR="/var/www/teklifmaster"

echo "=========================================="
echo "  Uygulama Kurulumu Başlıyor..."
echo "=========================================="

# 1. Backend kurulumu
echo ""
echo "1. Backend kuruluyor..."
cd $APP_DIR/backend

python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# JWT Secret oluştur
JWT_SECRET=$(openssl rand -hex 32)

# .env dosyası oluştur
cat > .env << EOF
MONGO_URL=mongodb://localhost:27017
DB_NAME=quotemaster_prod
CORS_ORIGINS=*
FRONTEND_URL=https://${DOMAIN}
IYZICO_API_KEY=NsgG18dIgsLOChdzb7zvSw9RfSKUGdGF
IYZICO_SECRET_KEY=SoWGW5mF0woFhdcXNCxiYAlyiwYYgjb8
IYZICO_BASE_URL=api.iyzipay.com
JWT_SECRET=${JWT_SECRET}
EOF

echo "[✓] Backend .env oluşturuldu"

# 2. Frontend kurulumu
echo ""
echo "2. Frontend kuruluyor..."
cd $APP_DIR/frontend

# .env dosyası
cat > .env << EOF
REACT_APP_BACKEND_URL=https://${DOMAIN}
EOF

yarn install
yarn build
echo "[✓] Frontend build tamamlandı"

# 3. Systemd service
echo ""
echo "3. Systemd service oluşturuluyor..."
cat > /etc/systemd/system/teklifmaster.service << EOF
[Unit]
Description=TeklifMaster Backend API
After=network.target mongod.service

[Service]
User=www-data
Group=www-data
WorkingDirectory=${APP_DIR}/backend
Environment="PATH=${APP_DIR}/backend/venv/bin"
ExecStart=${APP_DIR}/backend/venv/bin/uvicorn server:app --host 127.0.0.1 --port 8001
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Dizin izinleri
chown -R www-data:www-data $APP_DIR
chmod -R 755 $APP_DIR

systemctl daemon-reload
systemctl enable teklifmaster
systemctl start teklifmaster
echo "[✓] Backend servisi başlatıldı"

# 4. Nginx yapılandırması
echo ""
echo "4. Nginx yapılandırılıyor..."
cat > /etc/nginx/sites-available/teklifmaster << 'EOF'
server {
    listen 80;
    server_name teklifmaster.com www.teklifmaster.com;

    # Frontend
    root /var/www/teklifmaster/frontend/build;
    index index.html;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # API proxy
    location /api {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        client_max_body_size 10M;
    }

    # React Router
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Static files cache
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

ln -sf /etc/nginx/sites-available/teklifmaster /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
echo "[✓] Nginx yapılandırıldı"

# 5. SSL Sertifikası
echo ""
echo "5. SSL sertifikası alınıyor..."
certbot --nginx -d teklifmaster.com -d www.teklifmaster.com --non-interactive --agree-tos --email admin@teklifmaster.com --redirect || {
    echo "[!] SSL otomatik alınamadı. Manuel olarak çalıştırın:"
    echo "    certbot --nginx -d teklifmaster.com"
}

# 6. Firewall
echo ""
echo "6. Firewall yapılandırılıyor..."
ufw allow 22
ufw allow 80
ufw allow 443
ufw --force enable
echo "[✓] Firewall aktif"

echo ""
echo "=========================================="
echo "  KURULUM TAMAMLANDI!"
echo "=========================================="
echo ""
echo "  Site: https://teklifmaster.com"
echo ""
echo "  Kontrol komutları:"
echo "    systemctl status teklifmaster"
echo "    systemctl status nginx"
echo "    systemctl status mongod"
echo ""
echo "  Loglar:"
echo "    journalctl -u teklifmaster -f"
echo ""
echo "=========================================="
