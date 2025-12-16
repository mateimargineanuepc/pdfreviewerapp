# Cum să generezi JWT_SECRET

## Ce este JWT_SECRET?

`JWT_SECRET` este un secret key folosit pentru a semna și verifica token-urile JWT (JSON Web Tokens). Este un string aleatoriu pe care îl generezi tu - nu se obține dintr-un serviciu extern.

## Cum să generezi JWT_SECRET

### Metoda 1: Folosind Node.js (Recomandat)

Rulează în terminal:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Aceasta va genera un string aleatoriu de 128 de caractere (64 bytes în hex).

**Exemplu de output**:
```
a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
```

### Metoda 2: Folosind OpenSSL

```bash
openssl rand -hex 64
```

### Metoda 3: Online Generator

Poți folosi un generator online:
- https://randomkeygen.com/
- Selectează "CodeIgniter Encryption Keys" sau "Fort Knox Password"

**Notă**: Nu recomand generatoare online pentru producție - folosește-le doar pentru testare.

### Metoda 4: Manual (nu recomandat)

Poți crea manual un string lung și aleatoriu, dar este mai puțin sigur.

## Cerințe pentru JWT_SECRET

- **Lungime minimă**: 32 de caractere (recomandat: 64+ caractere)
- **Complexitate**: Folosește litere, cifre și caractere speciale
- **Unicitate**: Fiecare aplicație ar trebui să aibă un secret unic
- **Secrecy**: Nu îl partaja niciodată public sau în Git

## Cum să-l folosești

### În Development (`.env` local)

Creează sau actualizează `server/.env`:
```env
JWT_SECRET=your-generated-secret-key-here-minimum-32-characters
JWT_EXPIRES_IN=7d
```

### În Production (Render/Vercel/etc.)

1. **Generează secret-ul** folosind una din metodele de mai sus
2. **Adaugă-l în Environment Variables**:
   - Render: Dashboard → Environment → Add Environment Variable
   - Vercel: Settings → Environment Variables
   - Alte platforme: Similar

3. **Nume variabilă**: `JWT_SECRET`
4. **Valoare**: Secret-ul generat

## Exemplu complet

```bash
# 1. Generează secret-ul
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Output: a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef

# 2. Adaugă în .env
echo "JWT_SECRET=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef" >> server/.env

# 3. Sau adaugă manual în Render/Vercel dashboard
```

## Securitate

⚠️ **IMPORTANT**:
- **Nu commit JWT_SECRET în Git** - este deja în `.gitignore`
- **Folosește secret-uri diferite** pentru development și producție
- **Nu partaja secret-ul** cu alții
- **Regenerează secret-ul** dacă crezi că a fost compromis

## Verificare

După ce ai setat `JWT_SECRET`, verifică că funcționează:
1. Pornește serverul
2. Încearcă să te loghezi
3. Verifică că primești un JWT token valid

## Troubleshooting

### "JWT_SECRET is not defined"
- Verifică că ai adăugat variabila în `.env` (development) sau în dashboard (production)
- Verifică că numele variabilei este exact `JWT_SECRET` (case-sensitive)

### Token-uri invalide
- Asigură-te că folosești același `JWT_SECRET` în development și producție
- Verifică că secret-ul nu conține spații sau caractere invalide

