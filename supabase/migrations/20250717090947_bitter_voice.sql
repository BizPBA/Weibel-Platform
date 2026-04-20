/*
  # Fix storage bucket RLS policies for file uploads

  This migration creates the necessary RLS policies for the storage buckets
  to allow authenticated users to upload, read, and delete files.

  ## Storage Buckets
  1. location-images - for image uploads
  2. location-files - for comment file attachments

  ## Policies Created
  - Allow authenticated users to upload files
  - Allow authenticated users to read files
  - Allow users to delete their own uploaded files
*/

-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy for location-images bucket - Allow authenticated users to upload
CREATE POLICY "Allow authenticated users to upload to location-images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'location-images');

-- Policy for location-images bucket - Allow authenticated users to read
CREATE POLICY "Allow authenticated users to read from location-images"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'location-images');

-- Policy for location-images bucket - Allow users to delete their own files
CREATE POLICY "Allow users to delete own files from location-images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'location-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy for location-files bucket - Allow authenticated users to upload
CREATE POLICY "Allow authenticated users to upload to location-files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'location-files');

-- Policy for location-files bucket - Allow authenticated users to read
CREATE POLICY "Allow authenticated users to read from location-files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'location-files');

-- Policy for location-files bucket - Allow users to delete their own files
CREATE POLICY "Allow users to delete own files from location-files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'location-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Alternative simpler policies if the above don't work
-- Uncomment these if you want to allow all authenticated users full access

-- CREATE POLICY "Allow all authenticated users full access to location-images"
--   ON storage.objects
--   FOR ALL
--   TO authenticated
--   USING (bucket_id = 'location-images')
--   WITH CHECK (bucket_id = 'location-images');

-- CREATE POLICY "Allow all authenticated users full access to location-files"
--   ON storage.objects
--   FOR ALL
--   TO authenticated
--   USING (bucket_id = 'location-files')
--   WITH CHECK (bucket_id = 'location-files');