# Deployment Scripts

Scripturi pentru deployment-ul aplicației pe server.

## Fișiere

- `setup-server.sh` - Setup inițial al serverului (rulează o singură dată)
- `deploy.sh` - Script de deployment (rulează la fiecare update)
- `nginx-config.conf` - Configurație Nginx (template)

## Utilizare

### 1. Setup inițial (pe server)

```bash
# Upload scriptul pe server
scp setup-server.sh root@your-server-ip:/root/

# Conectează-te la server
ssh root@your-server-ip

# Rulează setup-ul
chmod +x setup-server.sh
./setup-server.sh
```

### 2. Deployment (pe server)

```bash
# Upload scriptul în directorul aplicației
cd /var/www/pdf-review-app
chmod +x deploy.sh

# Rulează deployment-ul
./deploy.sh
```

### 3. Configurare Nginx

```bash
# Copiază configurația
cp nginx-config.conf /etc/nginx/sites-available/pdf-review

# Editează și actualizează domeniul
nano /etc/nginx/sites-available/pdf-review

# Creează symlink
ln -s /etc/nginx/sites-available/pdf-review /etc/nginx/sites-enabled/

# Testează configurația
nginx -t

# Restart Nginx
systemctl restart nginx
```

### 4. SSL Certificate

```bash
# Obține certificat SSL
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Certbot va actualiza automat configurația Nginx
```

## Note

- Asigură-te că ai configurat toate variabilele de mediu înainte de deployment
- Verifică că MongoDB Atlas permite conexiuni de la IP-ul VPS-ului
- Verifică că Firebase Storage este configurat corect

