# InfoBridge

En moderne platform til håndtering af kunder, lokationer, medarbejdere og krav med integration til Microsoft Azure AD.

## Teknologi Stack

- **Frontend:** React 18 med TypeScript
- **Styling:** Tailwind CSS + shadcn/ui komponenter
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth + Microsoft Azure AD
- **Hosting:** Netlify
- **Build Tool:** Vite

## Features

- Kunde- og lokationshåndtering
- Medarbejderadministration med Azure AD sync
- Kravhåndtering med kategorier
- Fil- og billedupload
- Folder templates til struktureret dokumenthåndtering
- Favoritter system
- Real-time aktivitetslog
- Row Level Security (RLS) for data sikkerhed

## Kom i gang

### Forudsætninger

- Node.js 18+ og npm
- Supabase account
- Netlify account (til deployment)
- Microsoft Azure AD app registration (til SSO)

### Installation

```bash
# Installer dependencies
npm install

# Kør development server
npm run dev
```

## Environment Variables

Opret en `.env` fil baseret på `.env.example`:

```bash
cp .env.example .env
```

Udfyld følgende værdier:
- `VITE_SUPABASE_URL` - Din Supabase projekt URL
- `VITE_SUPABASE_ANON_KEY` - Din Supabase anon key
- `VITE_AZURE_CLIENT_ID` - Azure AD app client ID
- `VITE_AZURE_TENANT_ID` - Azure AD tenant ID
- `VITE_AZURE_REDIRECT_URI` - Callback URL for Azure login

## Development

```bash
# Start development server
npm run dev

# Lint kode
npm run lint

# Build til produktion
npm run build

# Preview produktion build
npm run preview
```

## Deployment

Se [`documentation/DEPLOYMENT_QUICKSTART.md`](documentation/DEPLOYMENT_QUICKSTART.md) for en hurtig guide.

For detaljeret deployment information, se [`documentation/DEPLOYMENT.md`](documentation/DEPLOYMENT.md).

### Kort Deployment Flow

1. Build projektet: `npm run build:prod`
2. Deploy migrations: `npm run deploy:migrations`
3. Deploy frontend: `npm run deploy:frontend`

Eller kør alt i én kommando:
```bash
npm run deploy
```

**Vigtigt:** Deployment skal køres fra din lokale maskine eller via CI/CD, ikke fra udviklingsmiljøet.

## Dokumentation

- [Deployment Guide](documentation/DEPLOYMENT.md)
- [Deployment Quickstart](documentation/DEPLOYMENT_QUICKSTART.md)
- [Microsoft Integration Setup](documentation/MICROSOFT_INTEGRATION_SETUP.md)
- [Azure API Documentation](documentation/AZURE_API_DOCUMENTATION.md)
- [Implementation Summary](documentation/IMPLEMENTATION_SUMMARY.md)

## Database Migrations

Migrations køres automatisk under deployment via `npm run deploy:migrations`.

For at køre migrations manuelt:
```bash
node scripts/deploy-migrations.mjs
```

## License

Proprietary
