# Deployment Quick Start Guide

## Plan rapid de deployment (30 minute)

### 📋 Checklist pre-deployment

- [ ] Cont VPS creat (Hetzner/DigitalOcean/Vultr)
- [ ] Domeniu cumpărat (Cloudflare/Namecheap)
- [ ] MongoDB Atlas cluster creat
- [ ] Firebase Storage configurat
- [ ] Repository Git pregătit (GitHub/GitLab)

---

## 🚀 Deployment rapid (pas cu pas)

### 1. Cumpără domeniul (5 minute)

1. Mergi la https://www.cloudflare.com/products/registrar/
2. Caută domeniul dorit (ex: `pdfreview.app`)
3. Adaugă la coș și finalizează cumpărarea
4. Notează nameserverele Cloudflare (vei avea nevoie la pasul 3)

---

### 2. Creează VPS (5 minute)

#### Hetzner Cloud (Recomandat):

1. Mergi la https://www.hetzner.com/cloud
2. Creează cont
3. Creează Cloud Server:
   - **Image:** Ubuntu 22.04
   - **Type:** CX11 (€4.51/lună)
   - **Location:** Alege cea mai apropiată de utilizatori
   - **SSH Key:** Adaugă cheia ta SSH (opțional, dar recomandat)
4. Notează IP-ul VPS-ului

---

### 3. Configurează DNS (5 minute)

#### În Cloudflare:

1. Mergi la Dashboard → Add a Site
2. Introdu domeniul tău
3. Cloudflare va detecta automat nameserverele
4. Actualizează nameserverele la registrar-ul tău
5. Adaugă A Records:
   ```
   Type: A
   Name: @
   Content: [IP-ul VPS-ului]
   Proxy: ON (☁️)
   
   Type: A
   Name: www
   Content: [IP-ul VPS-ului]
   Proxy: ON (☁️)
   ```

---

### 4. Setup server (10 minute)

#### Conectează-te la VPS:

```bash
ssh root@[IP-ul-VPS-ului]
```

#### Rulează setup script:

```bash
# Upload scriptul
# (Din local, în alt terminal)
scp scripts/deployment/setup-server.sh root@[IP-ul-VPS-ului]:/root/

# Pe server
chmod +x /root/setup-server.sh
/root/setup-server.sh
```

Sau manual:

```bash
# Update
apt update && apt upgrade -y

# Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Nginx
apt install -y nginx

# PM2
npm install -g pm2 serve

# Firewall
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
```

---

### 5. Clonează și configurează aplicația (10 minute)

#### Pe server:

```bash
# Clonează repository-ul
cd /var/www
git clone [URL-repository] pdf-review-app
cd pdf-review-app

# Upload scripturile de deployment
# (Din local)
scp scripts/deployment/deploy.sh root@[IP]:/var/www/pdf-review-app/
scp scripts/deployment/pm2-ecosystem.config.js root@[IP]:/var/www/pdf-review-app/
```

#### Configurează variabilele de mediu:

```bash
cd server
cp .env.example .env
nano .env
```

Completează:
```env
PORT=3000
MONGO_URI=mongodb+srv://[user]:[password]@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
JWT_SECRET=[generați-un-secret-aleator-puternic]
JWT_EXPIRES_IN=7d
FIREBASE_SERVICE_ACCOUNT_PATH=/var/www/pdf-review-app/server/config/firebase-service-account.json
FIREBASE_STORAGE_BUCKET=gs://[bucket-name]
NODE_ENV=production
```

#### Upload Firebase Service Account:

```bash
# Din local
scp server/config/firebase-service-account.json root@[IP]:/var/www/pdf-review-app/server/config/
```

---

### 6. Build și start aplicația (5 minute)

```bash
# Instalează dependențele
cd /var/www/pdf-review-app/server
npm install --production

cd ../client
npm install
npm run build

# Creează .env.production pentru frontend
echo "VITE_API_BASE_URL=https://yourdomain.com" > .env.production
npm run build  # Rebuild cu URL corect

# Start cu PM2
cd /var/www/pdf-review-app
pm2 start pm2-ecosystem.config.js
pm2 save
pm2 startup  # Configurează auto-start
```

---

### 7. Configurează Nginx (5 minute)

```bash
# Copiază configurația
cp scripts/deployment/nginx-config.conf /etc/nginx/sites-available/pdf-review

# Editează și actualizează domeniul
nano /etc/nginx/sites-available/pdf-review
# Schimbă "yourdomain.com" cu domeniul tău

# Activează
ln -s /etc/nginx/sites-available/pdf-review /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default  # Șterge default

# Testează
nginx -t

# Restart
systemctl restart nginx
```

---

### 8. SSL Certificate (2 minute)

Cloudflare oferă SSL automat dacă Proxy este ON (☁️).

Sau cu Let's Encrypt:

```bash
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

### 9. Verificare finală

1. **Verifică status:**
   ```bash
   pm2 status
   systemctl status nginx
   ```

2. **Verifică logs:**
   ```bash
   pm2 logs
   ```

3. **Testează aplicația:**
   - Deschide `https://yourdomain.com` în browser
   - Verifică că frontend-ul se încarcă
   - Testează login/register
   - Testează upload document (dacă ești admin)

---

## 🔄 Update aplicație (după deployment)

```bash
cd /var/www/pdf-review-app
git pull
./deploy.sh
```

---

## 📊 Costuri finale

| Serviciu | Cost |
|----------|------|
| Hetzner VPS | €4.51/lună (~$5) |
| Cloudflare Domain | $10/an (~$0.83/lună) |
| MongoDB Atlas | $0 (Free tier) |
| Firebase Storage | $0 (Free tier) |
| **TOTAL** | **~$6/lună** |

---

## 🆘 Troubleshooting

### Aplicația nu se încarcă:
```bash
pm2 logs
systemctl status nginx
nginx -t
```

### Eroare MongoDB:
- Verifică că IP-ul VPS-ului este în whitelist MongoDB Atlas
- Verifică connection string în `.env`

### Eroare Firebase:
- Verifică că service account JSON este corect
- Verifică că bucket name este corect

### DNS nu funcționează:
- Verifică că A records sunt configurate corect
- Așteaptă până la 24 de ore pentru propagare (de obicei 1-2 ore)

---

## 📞 Suport

Pentru probleme:
1. Verifică logs: `pm2 logs`
2. Verifică Nginx: `journalctl -u nginx`
3. Verifică firewall: `ufw status`
4. Testează conectivitate: `curl http://localhost:3000`

---

**Timp total estimat:** 30-45 minute

