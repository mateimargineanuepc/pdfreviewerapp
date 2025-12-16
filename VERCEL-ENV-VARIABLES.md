# Environment Variables pentru Vercel

## Variabile de mediu necesare

### 1. `VITE_API_BASE_URL` (OBLIGATORIU)

**Descriere**: URL-ul complet al backend-ului (Express.js server)

**Format**: 
```
https://your-backend-domain.com
```
sau
```
https://api.yourdomain.com
```

**Exemplu**:
```
VITE_API_BASE_URL=https://api.example.com
```

**Notă**: 
- Nu include `/api` la final (se adaugă automat în cod)
- Trebuie să fie HTTPS în producție
- Dacă backend-ul rulează pe un port specific, include portul: `https://api.example.com:3000`

## Cum să adaugi în Vercel

1. În Vercel Dashboard, mergi la proiectul tău
2. Click pe **Settings** → **Environment Variables**
3. Adaugă:
   - **Name**: `VITE_API_BASE_URL`
   - **Value**: URL-ul backend-ului tău (ex: `https://api.yourdomain.com`)
   - **Environment**: Selectează **Production**, **Preview**, și **Development** (sau doar Production dacă vrei)

## Exemplu complet

Dacă backend-ul tău este deployat la:
- `https://backend.example.com` → setează `VITE_API_BASE_URL=https://backend.example.com`
- `https://api.example.com` → setează `VITE_API_BASE_URL=https://api.example.com`
- `https://your-app.railway.app` → setează `VITE_API_BASE_URL=https://your-app.railway.app`

## Verificare

După deploy, verifică în browser console că API calls-urile merg către URL-ul corect:
```javascript
// Ar trebui să vezi requests către: https://your-backend-url.com/api/...
```

## Notă importantă

⚠️ **Backend-ul trebuie să fie deployat și accesibil** înainte de a seta această variabilă.

Dacă backend-ul nu este încă deployat:
- Poți lăsa variabila goală temporar (frontend-ul va folosi `http://localhost:3000` ca fallback)
- Sau setează-o după ce backend-ul este live

