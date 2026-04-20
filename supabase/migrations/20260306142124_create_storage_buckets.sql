/*
  # Create storage buckets

  ## New Buckets
  - `location-images` - Billeder knyttet til lokationer (public)
  - `location-files` - Filer/dokumenter knyttet til lokationer (public)
  - `company-logos` - Firmalogoer (public)

  ## Security
  - Alle buckets er offentlige (public) så filer kan vises direkte via URL
  - RLS policies sikrer at kun autentificerede brugere kan uploade/slette
  - Alle kan læse/se filer (nødvendigt for at vise billeder og logoer)
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('location-images', 'location-images', true, 52428800, ARRAY['image/jpeg','image/jpg','image/png','image/gif','image/webp','image/svg+xml'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('location-files', 'location-files', true, 52428800, NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('company-logos', 'company-logos', true, 5242880, ARRAY['image/jpeg','image/jpg','image/png','image/gif','image/webp','image/svg+xml'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload location images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'location-images');

CREATE POLICY "Anyone can view location images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'location-images');

CREATE POLICY "Authenticated users can update location images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'location-images');

CREATE POLICY "Authenticated users can delete location images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'location-images');

CREATE POLICY "Authenticated users can upload location files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'location-files');

CREATE POLICY "Anyone can view location files"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'location-files');

CREATE POLICY "Authenticated users can update location files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'location-files');

CREATE POLICY "Authenticated users can delete location files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'location-files');

CREATE POLICY "Authenticated users can upload company logos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'company-logos');

CREATE POLICY "Anyone can view company logos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'company-logos');

CREATE POLICY "Authenticated users can update company logos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'company-logos');

CREATE POLICY "Authenticated users can delete company logos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'company-logos');
