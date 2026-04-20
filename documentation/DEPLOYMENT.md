# Deployment Guide

Denne guide beskriver hvordan du deployer Weibel Platform til produktion.

## Overview

Deployment består af tre hovedkomponenter:
1. **Frontend** - React app hosted på Netlify
2. **Database** - Supabase PostgreSQL med migrations
3. **Edge Functions** - Supabase serverless functions

**VIGTIGT:** Deployment skal udføres fra din lokale maskine eller via CI/CD pipeline. Netlify CLI kræver fuld netværksadgang som ikke er tilgængelig i alle udviklingsmiljøer.

## Forudsætninger

Du skal bruge følgende før du kan deploye:

### Supabase (Database & Auth)
- Supabase projekt URL
- Supabase Anon Key
- Supabase Service Role Key

### Netlify (Hosting)
- Netlify account
- Netlify site oprettet

### Microsoft Azure (Optional - for SSO)
- Azure AD App Registration
- Azure Client ID & Tenant ID
- Azure Client Secret

## Initial Setup

### 1. Installer Dependencies (på din lokale maskine)

```bash
npm install
```

Dette installerer alle nødvendige pakker inklusiv `dotenv`.

**Bemærk om Netlify CLI:**
- Netlify CLI er IKKE inkluderet i package.json pga. installation problemer i visse miljøer
- Installer det globalt på din lokale maskine: `npm install -g netlify-cli`
- Eller brug `npx netlify` kommandoer direkte (anbefalet)

### 2. Opret Produktions Environment Fil

Kopier `.env.production.example` til `.env.production`:

```bash
cp .env.production.example .env.production
```

### 3. Konfigurer Environment Variables

Rediger `.env.production` og udfyld følgende:

```bash
# Supabase Configuration (REQUIRED)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Netlify Configuration (OPTIONAL hvis du bruger netlify login/link)
NETLIFY_SITE_ID=your-site-id
NETLIFY_AUTH_TOKEN=your-auth-token

# Azure AD Configuration (OPTIONAL - kun hvis du bruger Microsoft SSO)
VITE_AZURE_CLIENT_ID=your-azure-client-id
VITE_AZURE_TENANT_ID=your-azure-tenant-id
VITE_AZURE_REDIRECT_URI=https://your-domain.netlify.app/callback
AZURE_CLIENT_SECRET=your-azure-client-secret
```

**VIGTIGT:** `.env.production` er i `.gitignore` og må ALDRIG committes til git!

### 4. Installer Netlify CLI (kun på din lokale maskine)

```bash
# Global installation (anbefalet for lokal udvikling)
npm install -g netlify-cli

# Verificer installation
netlify --version
```

### 5. Log ind på Netlify CLI

```bash
# Via npm script
npm run netlify:login

# Eller direkte
npx netlify login
# eller hvis globalt installeret:
netlify login
```

Dette åbner en browser hvor du autoriserer Netlify CLI.

### 6. Link Netlify Site (første gang)

```bash
# Via npm script
npm run netlify:link

# Eller direkte
npx netlify link
# eller hvis globalt installeret:
netlify link
```

Vælg dit produktions site fra listen.

**Vigtigt:** Når du bruger `netlify login` og `netlify link` kommandoerne, behøver du ikke `NETLIFY_SITE_ID` og `NETLIFY_AUTH_TOKEN` i `.env.production` filen. Netlify CLI gemmer disse credentials lokalt.

## Deployment Kommandoer

### Fuld Deployment til Produktion

Denne kommando bygger frontend, kører migrations, og deployer alt:

```bash
npm run deploy
```

Dette kører i rækkefølge:
1. `npm run build:prod` - Bygger frontend med production environment
2. `npm run deploy:migrations` - Kører database migrations
3. `npm run deploy:frontend` - Deployer til Netlify

### Kun Frontend Deployment

Hvis du kun vil opdatere frontend uden at køre migrations:

```bash
npm run build:prod
npm run deploy:frontend
```

### Preview Deployment

Test deployment før produktion:

```bash
npm run deploy:preview
```

Dette deployer til en preview URL på Netlify.

### Kun Database Migrations

Kør kun database migrations uden at deploye frontend:

```bash
npm run deploy:migrations
```

## Netlify Environment Variables

Efter deployment skal du konfigurere environment variables i Netlify Dashboard:

1. Gå til: Site Settings > Environment Variables
2. Tilføj følgende variabler:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_AZURE_CLIENT_ID=your-azure-client-id
VITE_AZURE_TENANT_ID=your-azure-tenant-id
VITE_AZURE_REDIRECT_URI=https://your-domain.netlify.app/callback
```

**Bemærk:** `VITE_` prefixed variabler bliver bundled i frontend koden. Brug aldrig secrets med dette prefix.

## Database Migrations

### Automatisk Migration Deployment

Migrations køres automatisk ved `npm run deploy`.

### Manuel Migration Deployment

Hvis du vil køre migrations separat:

```bash
node scripts/deploy-migrations.mjs
```

Dette script:
1. Læser alle SQL filer fra `supabase/migrations/`
2. Checker hvilke migrations der allerede er kørt
3. Kører kun nye migrations
4. Gemmer migration status i `migrations` tabellen

### Migration Best Practices

- Alle migrations skal være idempotente (kan køres flere gange uden fejl)
- Brug `IF EXISTS` og `IF NOT EXISTS` i SQL
- Test migrations lokalt først
- Lav altid backup før store migrations

## Edge Functions Deployment

Edge functions deployes via Supabase CLI eller MCP tools:

```bash
# List deployed functions
# (bruger Supabase MCP tools)

# Deploy en ny function
# (bruger Supabase MCP tools)
```

Se [Azure API Documentation](AZURE_API_DOCUMENTATION.md) for detaljer om edge functions.

## Post-Deployment Checklist

Efter deployment skal du verificere:

- [ ] Frontend er tilgængelig på produktions URL
- [ ] Login funktionalitet virker
- [ ] Microsoft SSO virker (hvis aktiveret)
- [ ] Database migrations er kørt korrekt
- [ ] Environment variables er sat korrekt i Netlify
- [ ] Ingen JavaScript errors i browser console
- [ ] API calls virker til Supabase
- [ ] Edge functions svarer korrekt

## CI/CD Pipeline (Valgfri)

For automatisk deployment ved git push, kan du opsætte CI/CD:

### GitHub Actions Example

Opret `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build:prod
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
          VITE_AZURE_CLIENT_ID: ${{ secrets.VITE_AZURE_CLIENT_ID }}
          VITE_AZURE_TENANT_ID: ${{ secrets.VITE_AZURE_TENANT_ID }}
          VITE_AZURE_REDIRECT_URI: ${{ secrets.VITE_AZURE_REDIRECT_URI }}

      - name: Deploy migrations
        run: npm run deploy:migrations
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}

      - name: Deploy to Netlify
        run: npx netlify deploy --prod --dir=dist
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

Tilføj secrets i GitHub Repository Settings > Secrets and variables > Actions.

## Troubleshooting

### Build Fejler

Hvis build fejler:
- Kør `npm run lint` og fix alle fejl
- Check at alle environment variables er sat korrekt
- Verificer at alle imports er korrekte

### Netlify Deploy Fejl

Hvis Netlify deployment fejler:
- Check at du er logget ind: `netlify status` eller `npx netlify status`
- Verificer at site er linket: `netlify link` eller `npx netlify link`
- Hvis du bruger environment variables i `.env.production`, check at auth token er gyldigt
- Prøv at logge ud og ind igen: `netlify logout` og derefter `netlify login`

### Netlify CLI Installation Fejler

Hvis du ikke kan installere Netlify CLI pga. netværksbegrænsninger:

**Alternativ 1: Manuel deployment via Netlify Web UI**
```bash
# 1. Build projektet
npm run build:prod

# 2. Drag-and-drop 'dist' mappen til Netlify's web interface
# https://app.netlify.com/drop

# 3. Kør migrations manuelt
npm run deploy:migrations
```

**Alternativ 2: CI/CD Pipeline**
Opsæt GitHub Actions, GitLab CI, eller lignende til at køre deployment automatisk ved push til main branch.

### Database Migration Fejler

Hvis migrations fejler:
- Check `SUPABASE_SERVICE_ROLE_KEY` er korrekt
- Verificer SQL syntax i migration filer
- Check Supabase logs for fejlbeskeder
- Kør migrations manuelt via Supabase Dashboard

### Environment Variables Ikke Tilgængelige

Hvis environment variables ikke virker i appen:
- Check at de starter med `VITE_` prefix
- Verificer at de er sat i Netlify Dashboard
- Rebuild og redeploy efter at have ændret environment variables

## Monitorering

Efter deployment:

1. **Netlify Dashboard**
   - Monitor build status
   - Check deploy logs
   - Verificer environment variables

2. **Supabase Dashboard**
   - Monitor database performance
   - Check auth logs
   - Verificer edge function calls

3. **Browser DevTools**
   - Check console for errors
   - Monitor network requests
   - Verificer API responses

## Rollback

Hvis der er problemer efter deployment:

### Frontend Rollback
```bash
# I Netlify Dashboard:
# Deploys > Select previous deploy > Publish deploy
```

### Database Rollback
Database rollback skal gøres manuelt:
1. Identificer problematisk migration
2. Skriv en ny migration der reverser ændringerne
3. Deploy den nye migration

## Support

For problemer eller spørgsmål, se også:
- [DEPLOYMENT_QUICKSTART.md](DEPLOYMENT_QUICKSTART.md) - Hurtig opsætning
- [MICROSOFT_INTEGRATION_SETUP.md](MICROSOFT_INTEGRATION_SETUP.md) - Azure AD setup
- [AZURE_API_DOCUMENTATION.md](AZURE_API_DOCUMENTATION.md) - API dokumentation
