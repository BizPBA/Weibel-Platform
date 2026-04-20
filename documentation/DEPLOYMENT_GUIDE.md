# Supabase Deployment Guide

## Option A: Manual SQL Upload (Hurtigst)

1. **Opret nyt Supabase projekt**
   - Gå til https://supabase.com/dashboard
   - Klik "New project"
   - Vælg navn, region og database password
   - Vent 2-3 minutter til projektet er klar

2. **Upload migrations**
   - Gå til **SQL Editor** i venstre sidebar
   - Klik **"New query"**
   - Åbn filen `combined_migrations.sql` fra projektet
   - Copy hele indholdet (6656 linjer)
   - Paste i SQL Editor
   - Klik **"Run"** (øverst til højre)
   - Vent til alle queries er kørt (kan tage 1-2 min)

3. **Verificer database**
   - Gå til **Table Editor**
   - Check at alle tables er oprettet:
     - companies
     - profiles
     - customers
     - locations
     - location_assignments
     - location_requirements
     - location_images
     - location_notes
     - location_contacts
     - location_folders
     - folder_templates
     - company_invitations
     - user_favorites
     - azure_sync_errors
     - osv.

4. **Hent credentials**
   - Gå til **Project Settings** → **API**
   - Copy:
     - `Project URL` (VITE_SUPABASE_URL)
     - `anon public` key (VITE_SUPABASE_ANON_KEY)

---

## Option B: Via Supabase CLI (Avanceret)

### 1. Login til Supabase

```bash
npx supabase login
```

### 2. Link til dit projekt

```bash
npx supabase link --project-ref <dit-projekt-ref>
```

Project ref finder du i Project Settings → General → Reference ID

### 3. Push migrations

```bash
npx supabase db push
```

Dette vil køre alle migrations i `supabase/migrations/` mappen i rækkefølge.

---

## Option C: Deploy Edge Functions

Efter database er sat op, deploy edge functions:

```bash
npx supabase functions deploy authenticate-passkey
npx supabase functions deploy delete-passkey
npx supabase functions deploy get-microsoft-consent-url
npx supabase functions deploy get-microsoft-groups
npx supabase functions deploy get-passkeys
npx supabase functions deploy register-passkey
npx supabase functions deploy send-invitation-email
npx supabase functions deploy send-welcome-email
npx supabase functions deploy sync-azure-users-enhanced
npx supabase functions deploy sync-company-users
```

Eller deploy alle på én gang:

```bash
for func in supabase/functions/*/; do
  name=$(basename "$func")
  npx supabase functions deploy "$name"
done
```

---

## Environment Variables

Efter deployment, tilføj disse environment variables til dit Netlify projekt:

```
VITE_SUPABASE_URL=https://[dit-projekt-id].supabase.co
VITE_SUPABASE_ANON_KEY=[din-anon-key]
VITE_AZURE_CLIENT_ID=[din-azure-client-id]
VITE_AZURE_TENANT_ID=[din-azure-tenant-id]
VITE_AZURE_REDIRECT_URI=https://[din-app].netlify.app/auth/callback
```

---

## Troubleshooting

### "permission denied" fejl
- Check at RLS policies er korrekt sat op
- Verificer at `auth.uid()` bruges i policies

### Edge functions virker ikke
- Check at environment variables er sat i Supabase Dashboard
- Gå til Functions → Configuration → Add environment variable

### Microsoft integration virker ikke
- Verificer Azure App Registration redirect URIs
- Check at API permissions er granted (User.Read, User.ReadBasic.All)
- Verificer tenant ID og client ID er korrekte

---

## Next Steps

1. Test login funktionalitet
2. Opret første company via onboarding flow
3. Test Microsoft integration
4. Invite team members
5. Upload kunde data
