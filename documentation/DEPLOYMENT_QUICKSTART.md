# Quick Start: Deployment Setup

Dette er en hurtig guide til at komme i gang med deployment. For den fulde guide, se `DEPLOYMENT.md`.

**VIGTIGT:** Deployment skal udføres fra din lokale maskine eller CI/CD pipeline, ikke fra udviklingsmiljøet. Netlify CLI kræver netværksadgang som ikke er tilgængelig i alle miljøer.

## 1. Installer Dependencies (på din lokale maskine)

```bash
npm install
```

Dette installerer alle dependencies.

## 2. Opret `.env.production`

```bash
cp .env.production.example .env.production
```

Rediger `.env.production` og udfyld:
- `VITE_SUPABASE_URL` - Din produktions Supabase URL
- `VITE_SUPABASE_ANON_KEY` - Din produktions Supabase Anon Key
- `SUPABASE_SERVICE_ROLE_KEY` - Din produktions Service Role Key (til migrations)
- `NETLIFY_SITE_ID` - Dit Netlify site ID (valgfri hvis du bruger link kommando)
- `NETLIFY_AUTH_TOKEN` - Dit Netlify auth token (valgfri hvis du bruger login kommando)

## 3. Installer og Link Netlify (kun på din lokale maskine)

Netlify CLI skal køres fra din lokale maskine:

```bash
# Installer Netlify CLI globalt på din lokale maskine
npm install -g netlify-cli

# Eller brug npx direkte (uden global installation)
npx netlify login
npx netlify link
```

Alternativt brug npm scripts:
```bash
npm run netlify:login
npm run netlify:link
```

## 4. Deploy!

### Test deployment (preview):
```bash
npm run deploy:preview
```

### Fuld produktion deployment:
```bash
npm run deploy
```

Dette deployer:
1. Frontend build til Netlify
2. Database migrations til Supabase
3. Aktiverer det nye site

## Troubleshooting

### NPM permission fejl
Brug `npx netlify` kommandoer i stedet for global installation.

### Netlify CLI installation fejler
Hvis `netlify-cli` ikke kan installeres pga. netværksproblemer:
1. Kør deployment fra din lokale maskine i stedet
2. Alternativt kan du deploye manuelt via Netlify's web interface:
   - Build projektet: `npm run build:prod`
   - Upload `dist` mappen til Netlify
   - Kør migrations manuelt: `npm run deploy:migrations`

### Migration fejler
Check at `SUPABASE_SERVICE_ROLE_KEY` er sat korrekt i `.env.production`

### Build fejler
```bash
npm run lint
npm run build
```

For mere information, se `DEPLOYMENT.md`.
