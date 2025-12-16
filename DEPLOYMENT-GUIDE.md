# Deployment Guide - PDF Review Application

## Plan complet de deployment pentru producție

### 📊 Analiza necesarului

**Utilizatori:** ~40 utilizatori simultani  
**Documente:** ~30-40 PDF-uri, fiecare <1MB  
**Trafic estimat:** Scăzut (aplicație internă)  
**Budget recomandat:** $5-15/lună

---

## 🎯 Opțiunea recomandată: VPS (Virtual Private Server)

### De ce VPS?
- ✅ Control complet asupra serverului
- ✅ Cost fix și predictibil
- ✅ Suficient pentru 40 utilizatori
- ✅ Ușor de scalat dacă este necesar
- ✅ Poate rula atât frontend cât și backend

### Costuri estimate (lunare)
- **VPS:** $5-6/lună (Hetzner/DigitalOcean/Vultr)
- **Domeniu:** $10-15/an (~$1/lună)
- **MongoDB Atlas:** Gratis (Free tier - 512MB)
- **Firebase Storage:** Gratis (Free tier - 5GB)
- **Total:** ~$6-7/lună

---

## 📋 Plan de acțiune pas cu pas

### Pasul 1: Cumpărarea domeniului

#### Opțiuni recomandate:

1. **Cloudflare Registrar** (Recomandat)
   - Preț: ~$8-10/an
   - Include: DNS management gratuit
   - URL: https://www.cloudflare.com/products/registrar/

2. **Namecheap**
   - Preț: ~$10-15/an
   - Interface ușor de folosit
   - URL: https://www.namecheap.com/

3. **Google Domains** (acum Squarespace)
   - Preț: ~$12/an
   - URL: https://domains.google/

#### Pași:
1. Alege un nume de domeniu (ex: `pdfreview.com`, `pdfreview.app`)
2. Verifică disponibilitatea
3. Cumpără domeniul
4. Configurează DNS-ul (va fi folosit la Pasul 3)

---

### Pasul 2: Alegerea și configurarea VPS-ului

#### Opțiuni VPS recomandate:

#### 1. **Hetzner Cloud** (Cea mai ieftină - Recomandat)
- **Preț:** €4.51/lună (~$5/lună)
- **Specs:** 2 vCPU, 4GB RAM, 40GB SSD
- **Locație:** Germania (bună pentru Europa)
- **URL:** https://www.hetzner.com/cloud
- **Avantaje:** 
  - Cel mai bun raport preț/performanță
  - Performanță excelentă
  - Suport bun

#### 2. **DigitalOcean**
- **Preț:** $6/lună
- **Specs:** 1 vCPU, 1GB RAM, 25GB SSD
- **URL:** https://www.digitalocean.com/
- **Avantaje:**
  - Interface foarte ușor
  - Documentație excelentă
  - Community mare

#### 3. **Vultr**
- **Preț:** $6/lună
- **Specs:** 1 vCPU, 1GB RAM, 25GB SSD
- **URL:** https://www.vultr.com/
- **Avantaje:**
  - Locații multiple
  - Performanță bună

#### Configurare VPS:

1. **Creează cont** pe platforma aleasă
2. **Creează un VPS:**
   - OS: Ubuntu 22.04 LTS (recomandat)
   - Regiune: Alege cea mai apropiată de utilizatori
   - Size: Cel mai mic plan (suficient pentru 40 utilizatori)
3. **Notează IP-ul** VPS-ului (va fi folosit pentru DNS)

---

### Pasul 3: Configurarea DNS-ului

#### Dacă folosești Cloudflare (Recomandat):

1. **Adaugă site-ul în Cloudflare:**
   - Mergi la https://dash.cloudflare.com/
   - Click "Add a Site"
   - Introdu domeniul tău
   - Cloudflare va detecta automat nameserverele

2. **Actualizează nameserverele la registrar:**
   - Copiază nameserverele din Cloudflare
   - Mergi la registrar-ul tău (unde ai cumpărat domeniul)
   - Actualizează nameserverele

3. **Configurează DNS Records în Cloudflare:**
   ```
   Type    Name    Content           Proxy
   A       @       [IP-ul VPS-ului]   ☁️ (Proxied - ON)
   A       www     [IP-ul VPS-ului]   ☁️ (Proxied - ON)
   ```

#### Dacă NU folosești Cloudflare:

1. Mergi la registrar-ul tău
2. Configurează DNS Records:
   ```
   Type    Name    Value
   A       @       [IP-ul VPS-ului]
   A       www     [IP-ul VPS-ului]
   ```

**Notă:** DNS-ul poate dura până la 24 de ore să se propage, dar de obicei durează 1-2 ore.

---

### Pasul 4: Configurarea serverului VPS

#### Conectare la VPS:

```bash
ssh root@[IP-ul-VPS-ului]
```

#### Script de setup automat:

Creează un script `setup-server.sh` pe VPS:

```bash
#!/bin/bash

# Update system
apt update && apt upgrade -y

# Install Node.js 20.x LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install Nginx (reverse proxy)
apt install -y nginx

# Install PM2 (process manager)
npm install -g pm2

# Install Git
apt install -y git

# Install UFW (firewall)
apt install -y ufw
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# Install Certbot (for SSL certificates)
apt install -y certbot python3-certbot-nginx

echo "Server setup complete!"
```

Rulare:
```bash
chmod +x setup-server.sh
./setup-server.sh
```

---

### Pasul 5: Deployment-ul aplicației

#### Opțiunea A: Deployment manual (Recomandat pentru început)

1. **Clonează repository-ul pe server:**

```bash
cd /var/www
git clone [URL-ul-repository-ului] pdf-review-app
cd pdf-review-app
```

2. **Configurează variabilele de mediu:**

```bash
# Backend
cd server
cp .env.example .env
nano .env
```

Completează `.env`:
```env
PORT=3000
MONGO_URI=mongodb+srv://[user]:[password]@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
JWT_SECRET=[generați-un-secret-puternic]
JWT_EXPIRES_IN=7d
FIREBASE_SERVICE_ACCOUNT=[JSON-string-sau-path]
FIREBASE_STORAGE_BUCKET=gs://[bucket-name]
NODE_ENV=production
```

3. **Instalează dependențele:**

```bash
# Backend
cd server
npm install --production

# Frontend
cd ../client
npm install
npm run build
```

4. **Rulează aplicația cu PM2:**

```bash
# Din root-ul proiectului
cd /var/www/pdf-review-app

# Start backend
cd server
pm2 start server.js --name "pdf-review-backend"

# Serve frontend (opțional - vezi Nginx config)
cd ../client
pm2 serve dist 5173 --name "pdf-review-frontend" --spa
```

5. **Configurează PM2 pentru auto-restart:**

```bash
pm2 startup
pm2 save
```

#### Opțiunea B: Deployment automat cu Git (Recomandat pentru producție)

Creează scriptul `/var/www/pdf-review-app/deploy.sh`:

```bash
#!/bin/bash

echo "Starting deployment..."

# Pull latest changes
git pull origin main

# Backend
cd server
npm install --production
pm2 restart pdf-review-backend

# Frontend
cd ../client
npm install
npm run build
pm2 restart pdf-review-frontend

echo "Deployment complete!"
```

Rulare:
```bash
chmod +x deploy.sh
./deploy.sh
```

---

### Pasul 6: Configurarea Nginx (Reverse Proxy)

Creează `/etc/nginx/sites-available/pdf-review`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files (optional - for better performance)
    location /assets {
        alias /var/www/pdf-review-app/client/dist/assets;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Activează configurația:

```bash
ln -s /etc/nginx/sites-available/pdf-review /etc/nginx/sites-enabled/
nginx -t  # Test configuration
systemctl restart nginx
```

---

### Pasul 7: SSL Certificate (HTTPS)

#### Cu Cloudflare (Gratis și automat):
- Cloudflare oferă SSL automat (HTTPS)
- Nu este nevoie de Certbot dacă folosești Cloudflare Proxy

#### Fără Cloudflare (Let's Encrypt):

```bash
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Certbot va:
- Obține certificat SSL
- Configura Nginx automat
- Configura auto-renewal

---

### Pasul 8: Configurarea MongoDB Atlas

1. **Creează cont:** https://www.mongodb.com/cloud/atlas
2. **Creează cluster:** Alege "Free" tier (M0)
3. **Configurează Network Access:**
   - Adaugă IP-ul VPS-ului
   - Sau `0.0.0.0/0` pentru orice IP (mai puțin sigur, dar mai ușor)
4. **Creează Database User:**
   - Username și password
   - Role: "Atlas admin" sau "Read and write to any database"
5. **Obține Connection String:**
   - Click "Connect" → "Connect your application"
   - Copiază connection string-ul
   - Folosește-l în `server/.env` ca `MONGO_URI`

---

### Pasul 9: Configurarea Firebase Storage

1. **Creează/folosește proiectul Firebase existent**
2. **Configurează Storage:**
   - Mergi la Firebase Console → Storage
   - Creează bucket dacă nu există
3. **Obține Service Account:**
   - Project Settings → Service Accounts
   - Click "Generate new private key"
   - Salvează JSON-ul
4. **Upload pe server:**
   ```bash
   # Pe server
   mkdir -p /var/www/pdf-review-app/server/config
   # Upload fișierul JSON (folosind scp sau SFTP)
   ```
5. **Configurează în `.env`:**
   ```env
   FIREBASE_SERVICE_ACCOUNT_PATH=/var/www/pdf-review-app/server/config/firebase-service-account.json
   FIREBASE_STORAGE_BUCKET=gs://your-bucket-name
   ```

---

### Pasul 10: Actualizarea variabilelor de mediu frontend

Creează `/var/www/pdf-review-app/client/.env.production`:

```env
VITE_API_BASE_URL=https://yourdomain.com
```

Rebuild frontend:
```bash
cd client
npm run build
pm2 restart pdf-review-frontend
```

---

## 📊 Costuri finale estimate

| Serviciu | Cost | Perioadă |
|----------|------|----------|
| VPS (Hetzner) | €4.51 | Lună |
| Domeniu | $10 | An (~$0.83/lună) |
| MongoDB Atlas | $0 | Gratis (Free tier) |
| Firebase Storage | $0 | Gratis (Free tier) |
| **Total** | **~$5.50/lună** | **Lună** |

---

## 🔄 Alternative mai ieftine (dacă bugetul este foarte limitat)

### Opțiunea 1: Railway.app (Free tier + $5/lună)
- **Frontend:** Vercel (gratis)
- **Backend:** Railway (free tier, apoi $5/lună)
- **Total:** ~$5/lună
- **Avantaje:** Deployment foarte ușor
- **Dezavantaje:** Mai puțin control

### Opțiunea 2: Render.com
- **Frontend:** Render Static Site (gratis)
- **Backend:** Render Web Service (free tier, apoi $7/lună)
- **Total:** ~$7/lună
- **Avantaje:** Interface ușor
- **Dezavantaje:** Mai scump decât VPS

---

## 🚀 Scripturi de deployment

Voi crea scripturi automate pentru deployment în secțiunea următoare.

---

## 📝 Checklist final

- [ ] Domeniu cumpărat și configurat
- [ ] VPS creat și configurat
- [ ] DNS configurat (A records)
- [ ] Server setup complet (Node.js, Nginx, PM2)
- [ ] Aplicația clonată pe server
- [ ] Variabile de mediu configurate
- [ ] MongoDB Atlas configurat
- [ ] Firebase Storage configurat
- [ ] Nginx configurat
- [ ] SSL certificate instalat (HTTPS)
- [ ] PM2 configurat pentru auto-restart
- [ ] Testat accesul la aplicație
- [ ] Backup-uri configurate (opțional)

---

## 🔧 Mentenanță

### Update aplicație:
```bash
cd /var/www/pdf-review-app
./deploy.sh
```

### Verificare status:
```bash
pm2 status
pm2 logs
```

### Restart servicii:
```bash
pm2 restart all
systemctl restart nginx
```

---

## 📞 Suport

Pentru probleme de deployment, consultă:
- Documentația platformei VPS
- Logs: `pm2 logs` sau `journalctl -u nginx`
- MongoDB Atlas: Dashboard → Monitoring
- Firebase: Console → Usage

---

## ⚠️ Securitate

1. **Firewall:** UFW este configurat în script
2. **SSL:** HTTPS obligatoriu (Cloudflare sau Let's Encrypt)
3. **Secrets:** Nu comitați `.env` în Git
4. **Updates:** Actualizați sistemul regulat: `apt update && apt upgrade`
5. **Backups:** Configurați backup-uri pentru MongoDB și Firebase

---

## 📈 Scalare viitoare

Dacă aplicația crește:
- Upgrade VPS: $10-15/lună pentru mai multă memorie
- MongoDB Atlas: Paid tier dacă depășește free tier
- Firebase: Paid tier dacă depășește free tier
- CDN: Cloudflare (gratis) pentru static assets

---

**Ultima actualizare:** 2025-12-15

