#!/bin/bash

# TeklifMaster.com Otomatik Kurulum Scripti
# Sunucu: Ubuntu 22.04 LTS

set -e

echo "=========================================="
echo "  TeklifMaster.com Kurulum Başlıyor..."
echo "=========================================="

# Renk kodları
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Root kontrolü
if [ "$EUID" -ne 0 ]; then 
    print_error "Bu script root olarak çalıştırılmalı!"
    print_warning "Şu komutu kullanın: sudo bash install.sh"
    exit 1
fi

# 1. Sistem Güncelleme
echo ""
echo "1. Sistem güncelleniyor..."
apt update && apt upgrade -y
print_status "Sistem güncellendi"

# 2. Gerekli paketler
echo ""
echo "2. Gerekli paketler yükleniyor..."
apt install -y python3.11 python3.11-venv python3-pip nodejs npm nginx certbot python3-certbot-nginx git curl wget unzip
print_status "Paketler yüklendi"

# 3. MongoDB Kurulumu
echo ""
echo "3. MongoDB kuruluyor..."
if ! command -v mongod &> /dev/null; then
    curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
    echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] http://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
    apt update
    apt install -y mongodb-org
fi
systemctl start mongod
systemctl enable mongod
print_status "MongoDB kuruldu ve başlatıldı"

# 4. Uygulama dizini
echo ""
echo "4. Uygulama dizini oluşturuluyor..."
mkdir -p /var/www/teklifmaster
cd /var/www/teklifmaster
print_status "Dizin oluşturuldu: /var/www/teklifmaster"

# 5. Node.js güncelleme (v18+)
echo ""
echo "5. Node.js güncelleniyor..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs
npm install -g yarn
print_status "Node.js $(node -v) kuruldu"

echo ""
echo "=========================================="
echo -e "${GREEN}  Temel kurulum tamamlandı!${NC}"
echo "=========================================="
echo ""
echo "Şimdi uygulama dosyalarını yükleyin:"
echo "  cd /var/www/teklifmaster"
echo ""
echo "Dosyalar yüklendikten sonra:"
echo "  bash /var/www/teklifmaster/setup-app.sh"
echo ""
