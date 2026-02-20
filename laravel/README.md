# BauDok - Laravel + MySQL + React

Építési projekt dokumentációs rendszer.

## Követelmények

- PHP 8.1+
- MySQL/MariaDB
- Composer
- Node.js 18+
- Yarn vagy npm

## Telepítés

### 1. Composer függőségek

```bash
composer install
```

### 2. Környezeti fájl

```bash
cp .env.example .env
php artisan key:generate
```

Szerkeszd a `.env` fájlt:
```
DB_DATABASE=baudok
DB_USERNAME=root
DB_PASSWORD=a_te_jelszavad
```

### 3. Adatbázis létrehozása

```sql
CREATE DATABASE baudok CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. Migrációk futtatása

```bash
php artisan migrate
```

### 5. Upload mappák létrehozása

```bash
mkdir -p public/uploads/images
mkdir -p public/uploads/floorplans
chmod -R 775 public/uploads
```

### 6. Frontend build

```bash
cd frontend
yarn install
yarn build
cp -r build/* ../public/
```

### 7. Szerver indítása

Fejlesztéshez:
```bash
php artisan serve
```

Éles környezetben használj Nginx-et:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
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
```

## Funkciók

- Projektek kezelése
- Képfeltöltés 3 kategóriába (Alapszerelés, Szerelvényezés, Átadás)
- Tervrajzok feltöltése
- Képek pozicionálása tervrajzon
- Címkézés
- GPS koordináta rögzítés
- Előtte-utána összehasonlítás
