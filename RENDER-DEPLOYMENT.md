# Render Deployment Guide - Backend

## Configurație pentru Render

### Root Directory
Set to: **`server`** (sau `/server`)

### Build Command
```
npm install
```
sau lasă gol (Render va rula automat `npm install`)

**Notă**: Pentru Node.js/Express nu este nevoie de un build step real, doar instalarea dependențelor.

### Start Command
```
npm start
```
sau
```
node server.js
```

## Environment Variables necesare

Adaugă următoarele variabile de mediu în Render Dashboard → Environment:

### 1. `MONGO_URI` (OBLIGATORIU)
```
mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```
**Exemplu**: MongoDB Atlas connection string

### 2. `JWT_SECRET` (OBLIGATORIU)
```
your-super-secret-jwt-key-here-minimum-32-characters
```
**Notă**: Folosește un string lung și aleatoriu pentru securitate

### 3. `JWT_EXPIRES_IN` (OPȚIONAL)
```
7d
```
**Default**: `7d` (7 zile)

### 4. `PORT` (OPȚIONAL)
```
10000
```
**Notă**: Render setează automat `PORT`, dar poți specifica manual

### 5. `FIREBASE_SERVICE_ACCOUNT` (OBLIGATORIU)
```
{"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}
```
**Notă**: JSON-ul complet al service account-ului Firebase (pe o singură linie)

**SAU**

### 5. `FIREBASE_SERVICE_ACCOUNT_PATH` (ALTERNATIVĂ)
```
/config/firebase-service-account.json
```
**Notă**: Dacă preferi să folosești un fișier (nu recomandat pe Render)

### 6. `FIREBASE_STORAGE_BUCKET` (OBLIGATORIU)
```
gs://your-bucket-name.firebasestorage.app
```
**Exemplu**: `gs://corectareanastasimatar.firebasestorage.app`

## Pași de deployment

1. **Creează un Web Service pe Render**
   - Click "New" → "Web Service"
   - Conectează repository-ul tău Git

2. **Configurează serviciul**:
   - **Name**: `pdf-review-backend` (sau ce vrei tu)
   - **Environment**: `Node`
   - **Region**: Alege cel mai apropiat (ex: `Frankfurt` pentru Europa)
   - **Branch**: `main` (sau branch-ul tău)
   - **Root Directory**: `server`
   - **Build Command**: `npm install` (sau lasă gol)
   - **Start Command**: `npm start`

3. **Adaugă Environment Variables**:
   - Mergi la "Environment" tab
   - Adaugă toate variabilele de mai sus

4. **Deploy**:
   - Click "Create Web Service"
   - Render va începe automat deploy-ul

## Verificare după deploy

1. Verifică logs în Render Dashboard
2. Testează endpoint-ul: `https://your-app.onrender.com/`
3. Ar trebui să vezi: `"API is running"`

## Notă despre Firebase Service Account

⚠️ **Recomandare**: Folosește `FIREBASE_SERVICE_ACCOUNT` (JSON string) în loc de `FIREBASE_SERVICE_ACCOUNT_PATH` pe Render, deoarece:
- Nu trebuie să gestionezi fișiere
- Mai sigur (nu expui fișiere în repo)
- Mai ușor de configurat

## Costuri Render

- **Free Tier**: 
  - 750 ore/lună
  - Spins down după 15 minute de inactivitate
  - Perfect pentru testare
  
- **Starter Plan**: $7/lună
  - Always on
  - Recomandat pentru producție

## Troubleshooting

### Build fails
- Verifică că Root Directory este setat la `server`
- Verifică că `package.json` există în `server/`

### App crashes
- Verifică logs în Render Dashboard
- Verifică că toate environment variables sunt setate corect
- Verifică MongoDB connection string

### Firebase errors
- Verifică că `FIREBASE_SERVICE_ACCOUNT` este un JSON valid (pe o singură linie)
- Verifică că `FIREBASE_STORAGE_BUCKET` este corect formatat

