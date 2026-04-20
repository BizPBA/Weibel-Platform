# Manuel Produktions Deployment Guide

Dette dokument beskriver den manuelle deployment proces til produktion.

## Oversigt

Deployment processen består af 5 steps:

1. 🔄 Manuel remapping til produktionsdatabase
2. 🗄️ Deploy database migreringer
3. 📦 Build dist mappen
4. 🚀 Manuel Netlify deployment
5. 🔄 Remap tilbage til development

## Forudsætninger

- Node.js og npm installeret
- Adgang til Supabase Dashboard
- Adgang til Netlify Dashboard (eller Netlify CLI)
- `.env.production` fil med korrekte credentials

## Deployment Kommando

Kør følgende kommando for at starte deployment processen:

```bash
npm run deploy:prod:manual
```

## Step-by-Step Guide

### Step 1: Remap til Produktionsdatabase

Script'et vil pause og bede dig om at remapppe til produktionsdatabasen:

1. Åbn Supabase Dashboard
2. Gå til Project Settings
3. Skift til produktionsprojektet: `rbuiyieqipsvrgmoekix`
4. Bekræft at du er på produktionsprojektet
5. Tryk Enter i terminalen når du er klar

**VIGTIGT:** Sørg for at du er mappet til PRODUKTIONSDATABASEN før du fortsætter!

### Step 2: Deploy Database Migreringer

Script'et vil vise information om migreringerne og spørge om du vil deploye dem.

For at køre migreringerne manuelt kan du bruge:

```bash
npm run deploy:migrations
```

Eller via Supabase Dashboard:
1. Gå til SQL Editor i Supabase Dashboard
2. Kør migration queries manuelt

### Step 3: Build Dist Mappen

Script'et vil automatisk bygge produktionsversionen:

```bash
npm run build:prod
```

Dette opretter `dist/` mappen med den optimerede produktion build.

### Step 4: Manuel Netlify Deployment

Du har flere muligheder for at deploye til Netlify:

#### Option A: Via Netlify CLI

```bash
npx netlify deploy --prod --dir=dist
```

#### Option B: Via Netlify Dashboard

1. Gå til https://app.netlify.com/
2. Vælg dit site
3. Gå til "Deploys"
4. Træk `dist` mappen til "Drop to upload"

#### Option C: Via Git Push

1. Commit dine ændringer
2. Push til main/master branch
3. Netlify deployer automatisk

### Step 5: Remap Tilbage til Development

**VIGTIGT:** Husk at remapppe tilbage til development databasen!

1. Åbn Supabase Dashboard
2. Gå til Project Settings
3. Skift tilbage til development projektet: `gqpyaqvpqgvjnfpjijln`
4. Bekræft at du er på development projektet
5. Tryk Enter i terminalen når du er færdig

## Database Information

### Development Database
- Project Ref: `gqpyaqvpqgvjnfpjijln`
- URL: `https://gqpyaqvpqgvjnfpjijln.supabase.co`

### Production Database
- Project Ref: `rbuiyieqipsvrgmoekix`
- URL: `https://rbuiyieqipsvrgmoekix.supabase.co`

## Verifikation Efter Deployment

Efter successful deployment, verificer følgende:

1. ✅ Test produktionsapplikationen i browseren
2. ✅ Verificer at alle funktioner virker korrekt
3. ✅ Tjek for fejl i browser console
4. ✅ Tjek Supabase logs for database fejl
5. ✅ Bekræft at du er mappet tilbage til development

## Troubleshooting

### Build Fejler

Hvis build fejler, tjek:
- TypeScript fejl i koden
- Manglende dependencies
- Environment variabler i `.env.production`

### Migration Fejler

Hvis migreringer fejler, tjek:
- Database permissions
- Service role key i `.env.production`
- Om migreringer allerede er kørt

### Netlify Deployment Fejler

Hvis Netlify deployment fejler, tjek:
- Om `dist` mappen eksisterer
- Netlify site configuration
- Build logs i Netlify Dashboard

## Sikkerhedsnoter

- ⚠️ Kør ALDRIG migrations på produktionsdatabasen uden backup
- ⚠️ Verificer ALTID at du er på den rigtige database før du kører migrations
- ⚠️ Test ALTID i development før deployment til produktion
- ⚠️ Husk ALTID at remapppe tilbage til development efter deployment

## Support

Ved problemer, kontakt:
- Development team lead
- Database administrator
- DevOps team
