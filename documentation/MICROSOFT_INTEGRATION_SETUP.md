# Microsoft Integration Setup Guide

Denne guide viser hvordan du sætter Microsoft Azure AD integration op for automatisk bruger synkronisering.

---

## 📋 Indhold

1. [Azure App Registration](#azure-app-registration)
2. [Environment Variables](#environment-variables)
3. [Database Migration](#database-migration)
4. [Opsætning i Applikationen](#opsætning-i-applikationen)
5. [Automatisk Synkronisering (Cron Job)](#automatisk-synkronisering-cron-job)
6. [Testing](#testing)
7. [Fejlfinding](#fejlfinding)

---

## Azure App Registration

### Trin 1: Opret App Registration

1. Gå til [Azure Portal](https://portal.azure.com)
2. Naviger til **Azure Active Directory** → **App registrations**
3. Klik **New registration**

**Indstillinger:**
- **Name**: Weibel Platform (eller dit app navn)
- **Supported account types**: **Accounts in this organizational directory only**
- **Redirect URI**:
  - Type: **Web**
  - URI: `https://yourdomain.com/auth/microsoft/company-consent`

### Trin 2: Konfigurer Permissions

Gå til **API permissions** → **Add a permission** → **Microsoft Graph**:

**Application Permissions** (til synkronisering):
- ✅ `Group.Read.All` - Læs alle grupper
- ✅ `User.Read.All` - Læs alle brugere
- ✅ `GroupMember.Read.All` - Læs gruppe medlemskaber

**VIGTIGT:** Klik **Grant admin consent** for din tenant!

### Trin 3: Opret Client Secret

1. Gå til **Certificates & secrets** → **Client secrets**
2. Klik **New client secret**
3. **Description**: "Production Secret"
4. **Expires**: 24 måneder (anbefalet)
5. Klik **Add**
6. **KOPIER VALUE STRAKS** (du kan ikke se det igen)

### Trin 4: Noter dine Credentials

Du skal bruge disse værdier:
- **Tenant ID**: Find i Azure Active Directory → Overview
- **Client ID**: Find i din App Registration → Overview
- **Client Secret**: Det du lige kopierede

---

## Environment Variables

Tilføj disse til din `.env` fil (bruges kun hvis du har global Azure app):

```bash
# Microsoft Azure (optional - bruges kun hvis du har en global app)
MICROSOFT_CLIENTID=your-client-id
MICROSOFT_CLIENTSECRET_VALUE=your-client-secret
```

**NOTE:** Når brugere sætter integration op gennem UI'et, bliver deres credentials gemt sikkert i databasen per company.

---

## Database Migration

Kør migrationen for at tilføje Azure integration felter til `companies` tabellen:

```bash
# Via Supabase CLI
supabase db push

# Eller manuel SQL
psql -f supabase/migrations/add_company_azure_integration.sql
```

Dette tilføjer følgende felter til `companies`:
- `azure_tenant_id` - Microsoft tenant ID
- `azure_client_id` - App client ID
- `azure_client_secret` - Krypteret secret
- `azure_admin_consent_granted` - Om consent er givet
- `azure_sync_enabled` - Auto sync aktiveret
- `azure_sync_group_id` - Gruppe at synkronisere fra
- `azure_auto_create_users` - Om brugere skal oprettes automatisk
- `azure_last_sync_at` - Sidste sync tidsstempel

---

## Opsætning i Applikationen

### Trin 1: Naviger til Settings

1. Log ind som **admin**
2. Gå til **Settings** → **Sikkerhed** tab
3. Du vil se **Microsoft Integration** kortet øverst

### Trin 2: Configure Azure Integration

1. Klik **Set Up Integration**
2. Udfyld formularen:
   - **Tenant ID**: Din Azure tenant ID
   - **Client ID**: Din app client ID
   - **Client Secret**: Din app client secret
3. Klik **Save Configuration**

### Trin 3: Grant Admin Consent

1. Klik **Grant Consent** knappen
2. Du bliver omdirigeret til Microsoft
3. Log ind med **Global Administrator** konto
4. Accepter de anmodede permissions
5. Du bliver omdirigeret tilbage til applikationen

**Status kortet viser nu:**
- ✅ Configuration: Active
- ✅ Admin Consent: Granted
- ⚠️ Sync Group: Not Set

### Trin 4: Vælg Sync Group

1. Efter admin consent vil dropdown vise alle dine Microsoft grupper
2. Vælg den gruppe hvis medlemmer skal synkroniseres
3. Gruppen opdateres automatisk

**Eksempel grupper:**
- "All Employees" - Alle ansatte
- "Weibel Platform Users" - Specifikke platform brugere
- "IT Department" - Kun IT afdeling

### Trin 5: Konfigurer Auto-Create Users

Toggle **Automatically Create Users** til/fra:

- **ON (anbefalet)**: Nye brugere oprettes automatisk når de tilføjes til gruppen
- **OFF**: Brugere skal oprettes manuelt først, synkronisering opdaterer kun eksisterende

### Trin 6: Manuel Sync

Test at det virker:

1. Klik **Sync Users Now**
2. Vent på synkroniseringen (typisk 10-30 sekunder)
3. Du ser en success besked med antal brugere synkroniseret

**Tjek resultat:**
- Gå til **Colleagues** siden
- Du burde se de nye brugere fra Microsoft gruppen

---

## Automatisk Synkronisering (Cron Job)

For at køre automatisk synkronisering én gang i døgnet, skal du sætte en cron job op.

### Option 1: Supabase Cron Extension (Anbefalet)

Hvis din Supabase instance har `pg_cron` extension:

```sql
-- Enable pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily sync at 3 AM
SELECT cron.schedule(
  'daily-azure-sync',
  '0 3 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://your-project.supabase.co/functions/v1/sync-company-users',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body := jsonb_build_object(
        'trigger_type', 'cron',
        'company_id', company_id
      )
    )
  FROM companies
  WHERE azure_sync_enabled = true
    AND azure_admin_consent_granted = true
    AND azure_sync_group_id IS NOT NULL;
  $$
);
```

**Verificer cron job:**
```sql
SELECT * FROM cron.job;
```

**Se cron job log:**
```sql
SELECT * FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 10;
```

### Option 2: External Cron (GitHub Actions)

Opret `.github/workflows/azure-sync.yml`:

```yaml
name: Daily Azure User Sync

on:
  schedule:
    - cron: '0 3 * * *'  # Kører kl. 3 om natten UTC
  workflow_dispatch:  # Manuel trigger

jobs:
  sync-users:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Azure User Sync
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{"trigger_type": "cron"}' \
            https://your-project.supabase.co/functions/v1/sync-company-users
```

**Setup:**
1. Gå til GitHub repository → Settings → Secrets
2. Tilføj `SUPABASE_SERVICE_ROLE_KEY` som secret
3. Opdater URL til din Supabase project
4. Commit workflow filen

### Option 3: Server Cron Job

På din egen server, opret en cron job:

```bash
# Rediger crontab
crontab -e

# Tilføj linje (kører kl. 3 om natten)
0 3 * * * curl -X POST -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" -H "Content-Type: application/json" -d '{"trigger_type":"cron"}' https://your-project.supabase.co/functions/v1/sync-company-users
```

### Option 4: Vercel Cron (hvis hosted på Vercel)

Opret `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/azure-sync",
      "schedule": "0 3 * * *"
    }
  ]
}
```

Opret API route `pages/api/cron/azure-sync.ts`:

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Verificer cron secret
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/sync-company-users`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ trigger_type: 'cron' }),
      }
    );

    const result = await response.json();
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: 'Sync failed' });
  }
}
```

---

## Testing

### Test 1: Manuel Sync

1. Gå til Settings → Sikkerhed → Microsoft Integration
2. Klik **Sync Users Now**
3. Vent på success besked
4. Verificer:
   - "Last Sync" tidsstempel er opdateret
   - Status badge viser "success"
   - Antal brugere synkroniseret vises

### Test 2: Verificer Brugere Oprettet

1. Gå til **Colleagues** siden
2. Filtrer på brugere med email domain fra din Azure tenant
3. Tjek at nye brugere er oprettet
4. Åbn en bruger og verificer:
   - Navn er fra Azure AD
   - Email matcher Azure AD
   - Rolle er sat til "employee" (standard)

### Test 3: Bruger Deaktivering

1. Fjern en bruger fra Microsoft gruppen i Azure AD
2. Kør manuel sync i applikationen
3. Gå til Colleagues og find brugeren
4. Brugeren burde vises som deaktiveret

### Test 4: Bruger Reaktivering

1. Tilføj brugeren tilbage til Microsoft gruppen
2. Kør manuel sync
3. Brugeren burde være aktiv igen

### Test 5: Cron Job (hvis sat op)

```sql
-- Tjek seneste cron kørsler
SELECT * FROM company_azure_sync_logs
WHERE trigger_type = 'cron'
ORDER BY sync_started_at DESC
LIMIT 5;

-- Verificer status
SELECT
  sync_started_at,
  sync_status,
  users_created,
  users_updated,
  users_deactivated,
  sync_duration_ms
FROM company_azure_sync_logs
WHERE trigger_type = 'cron'
ORDER BY sync_started_at DESC
LIMIT 1;
```

---

## Fejlfinding

### Problem: "Admin consent required"

**Løsning:**
1. Verificer at du klikkede "Grant Consent" i UI
2. Tjek at du loggede ind som Global Administrator
3. Tjek Azure Portal → App Registration → API Permissions
4. Klik "Grant admin consent for [org]" igen hvis nødvendigt

### Problem: "No groups found"

**Løsning:**
1. Verificer `Group.Read.All` permission er granted
2. Log ind på [Graph Explorer](https://developer.microsoft.com/graph/graph-explorer)
3. Test query: `GET https://graph.microsoft.com/v1.0/groups`
4. Hvis det virker i Graph Explorer men ikke i app, tjek client credentials

### Problem: "Failed to fetch users"

**Løsning:**
1. Verificer `User.Read.All` og `GroupMember.Read.All` permissions
2. Tjek at client secret ikke er udløbet (Azure Portal → App Registration)
3. Test med manuel Graph API call:
   ```bash
   curl -X GET \
     -H "Authorization: Bearer ACCESS_TOKEN" \
     https://graph.microsoft.com/v1.0/groups/GROUP_ID/members
   ```

### Problem: Sync fejler med "Token expired"

**Løsning:**
- Dette er normalt - access tokens udløber efter 1 time
- Edge function henter automatisk nye tokens
- Hvis det fortsætter, verificer client secret i database

### Problem: Brugere ikke deaktiveret

**Løsning:**
1. Tjek `deactivate_user` function eksisterer i database:
   ```sql
   SELECT * FROM pg_proc WHERE proname = 'deactivate_user';
   ```
2. Verificer at bruger har `azure_user_id` sat
3. Tjek sync log for errors:
   ```sql
   SELECT errors FROM company_azure_sync_logs ORDER BY sync_started_at DESC LIMIT 1;
   ```

### Problem: Cron job kører ikke

**Supabase pg_cron:**
```sql
-- Tjek om cron job eksisterer
SELECT * FROM cron.job WHERE jobname = 'daily-azure-sync';

-- Tjek seneste kørsler
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'daily-azure-sync')
ORDER BY start_time DESC
LIMIT 5;

-- Slet og genopret hvis nødvendigt
SELECT cron.unschedule('daily-azure-sync');
-- Kør setup script igen
```

**GitHub Actions:**
1. Gå til repository → Actions tab
2. Find "Daily Azure User Sync" workflow
3. Tjek seneste kørsler for fejl
4. Verificer `SUPABASE_SERVICE_ROLE_KEY` secret er sat

---

## Sikkerhed

### Best Practices

1. **Client Secrets**
   - Roter secrets hver 12-24 måneder
   - Brug forskellige secrets for prod/staging
   - Gem aldrig secrets i kode eller git

2. **Access Control**
   - Kun admins kan se Microsoft Integration kort
   - Kun admins kan trigger sync
   - Service role key beskyttet med RLS

3. **Monitoring**
   - Tjek sync logs regelmæssigt
   - Set up alerts for failed syncs
   - Monitor antal deaktiverede brugere

4. **Audit Trail**
   - Alle sync operationer logges
   - Admin consent events logges
   - Bruger deaktivering/aktivering logges

### Verificer Sikkerhed

```sql
-- Tjek RLS policies er aktiveret
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('companies', 'company_azure_sync_logs');

-- Skal returnere rowsecurity = true for begge

-- Tjek at client secrets er krypteret (ikke plain text)
SELECT
  id,
  name,
  length(azure_client_secret) as secret_length,
  azure_client_secret NOT LIKE '%-%' as is_encrypted
FROM companies
WHERE azure_client_secret IS NOT NULL;
```

---

## Support

### Logs til Debugging

```sql
-- Seneste sync logs
SELECT * FROM company_azure_sync_logs
ORDER BY sync_started_at DESC
LIMIT 10;

-- Failed syncs
SELECT * FROM company_azure_sync_logs
WHERE sync_status = 'failed'
ORDER BY sync_started_at DESC;

-- Audit log
SELECT * FROM company_audit_log
WHERE action LIKE '%azure%'
ORDER BY created_at DESC
LIMIT 20;

-- Aktive/deaktiverede brugere
SELECT
  COUNT(*) FILTER (WHERE is_active = true) as active_users,
  COUNT(*) FILTER (WHERE is_active = false) as deactivated_users,
  COUNT(*) FILTER (WHERE azure_user_id IS NOT NULL) as azure_synced_users
FROM profiles;
```

### Nyttige Queries

```sql
-- Find brugere fra specifik Azure gruppe
SELECT
  email,
  full_name,
  is_active,
  last_azure_sync
FROM profiles
WHERE company_id = 'YOUR_COMPANY_ID'
  AND azure_user_id IS NOT NULL
ORDER BY last_azure_sync DESC;

-- Sync statistik
SELECT
  DATE(sync_started_at) as date,
  COUNT(*) as total_syncs,
  SUM(users_created) as total_created,
  SUM(users_updated) as total_updated,
  SUM(users_deactivated) as total_deactivated,
  AVG(sync_duration_ms) as avg_duration_ms
FROM company_azure_sync_logs
WHERE company_id = 'YOUR_COMPANY_ID'
GROUP BY DATE(sync_started_at)
ORDER BY date DESC;
```

---

## Gendan Efter Fejl

Hvis noget går galt, kan du gendanne til en kendt god tilstand:

```sql
-- Reset Azure integration for en company
UPDATE companies
SET
  azure_admin_consent_granted = false,
  azure_sync_enabled = false,
  azure_sync_group_id = NULL,
  azure_last_sync_status = 'never'
WHERE id = 'YOUR_COMPANY_ID';

-- Fjern alle Azure sync logs
DELETE FROM company_azure_sync_logs
WHERE company_id = 'YOUR_COMPANY_ID';

-- Fjern Azure data fra brugere (men behold brugerne)
UPDATE profiles
SET
  azure_user_id = NULL,
  azure_principal_name = NULL,
  azure_tenant_id = NULL,
  last_azure_sync = NULL
WHERE company_id = 'YOUR_COMPANY_ID';
```

Efter reset, start forfra med setup processen.

---

**Version:** 1.0.0
**Sidst Opdateret:** 2025-01-07
**Status:** Produktionsklar ✅
