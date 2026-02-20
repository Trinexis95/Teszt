#!/bin/bash

# BauDok Laravel telepítési script
# Futtasd root-ként: sudo bash install.sh

echo "=== BauDok telepítés ==="

# 1. Adatbázis létrehozása
echo "MySQL adatbázis létrehozása..."
mysql -u root -e "CREATE DATABASE IF NOT EXISTS baudok CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 2. Composer függőségek
echo "Composer függőségek telepítése..."
composer install --no-dev --optimize-autoloader

# 3. Környezeti fájl
if [ ! -f .env ]; then
    cp .env.example .env
    php artisan key:generate
    echo "FONTOS: Szerkeszd a .env fájlt és add meg a MySQL jelszót!"
fi

# 4. Upload mappák
echo "Upload mappák létrehozása..."
mkdir -p public/uploads/images
mkdir -p public/uploads/floorplans
chmod -R 775 public/uploads
chmod -R 775 storage
chmod -R 775 bootstrap/cache

# 5. Migrációk
echo "Adatbázis migrációk..."
php artisan migrate --force

# 6. Frontend build
echo "Frontend build..."
cd frontend
yarn install
REACT_APP_BACKEND_URL="" yarn build
cp -r build/* ../public/
cd ..

echo "=== Telepítés kész! ==="
echo ""
echo "Nginx konfig minta: /etc/nginx/sites-available/baudok"
echo ""
cat << 'NGINX'
server {
    listen 80;
    server_name _;
    root /var/www/baudok/public;
    index index.php index.html;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
NGINX
