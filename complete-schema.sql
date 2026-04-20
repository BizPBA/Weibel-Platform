ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated users to read customers" ON customers;
DROP POLICY IF EXISTS "Allow authenticated users to manage customers" ON customers;
DROP POLICY IF EXISTS "Allow authenticated users to read customer_contacts" ON customer_contacts;
DROP POLICY IF EXISTS "Allow authenticated users to manage customer_contacts" ON customer_contacts;
DROP POLICY IF EXISTS "Allow authenticated users to read locations" ON locations;
DROP POLICY IF EXISTS "Allow authenticated users to manage locations" ON locations;
DROP POLICY IF EXISTS "Allow authenticated users to read location_requirements" ON location_requirements;
DROP POLICY IF EXISTS "Allow authenticated users to manage location_requirements" ON location_requirements;
DROP POLICY IF EXISTS "Allow authenticated users to read location_images" ON location_images;
DROP POLICY IF EXISTS "Allow authenticated users to manage location_images" ON location_images;
DROP POLICY IF EXISTS "Allow authenticated users to read location_activity" ON location_activity;
DROP POLICY IF EXISTS "Allow authenticated users to create location_activity" ON location_activity;
DROP POLICY IF EXISTS "Allow users to read own profile" ON profiles;
DROP POLICY IF EXISTS "Allow users to update own profile" ON profiles;
CREATE POLICY "Allow authenticated users to read customers"
  ON customers
  FOR SELECT
  TO authenticated
  USING (true);
CREATE POLICY "Allow authenticated users to manage customers"
  ON customers
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
CREATE POLICY "Allow authenticated users to read customer_contacts"
  ON customer_contacts
  FOR SELECT
  TO authenticated
  USING (true);
CREATE POLICY "Allow authenticated users to manage customer_contacts"
  ON customer_contacts
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
CREATE POLICY "Allow authenticated users to read locations"
  ON locations
  FOR SELECT
  TO authenticated
  USING (true);
CREATE POLICY "Allow authenticated users to manage locations"
  ON locations
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
CREATE POLICY "Allow authenticated users to read location_requirements"
  ON location_requirements
  FOR SELECT
  TO authenticated
  USING (true);
CREATE POLICY "Allow authenticated users to manage location_requirements"
  ON location_requirements
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
CREATE POLICY "Allow authenticated users to read location_images"
  ON location_images
  FOR SELECT
  TO authenticated
  USING (true);
CREATE POLICY "Allow authenticated users to manage location_images"
  ON location_images
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
CREATE POLICY "Allow authenticated users to read location_activity"
  ON location_activity
  FOR SELECT
  TO authenticated
  USING (true);
CREATE POLICY "Allow authenticated users to create location_activity"
  ON location_activity
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = actor_id);
CREATE POLICY "Allow users to read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);
CREATE POLICY "Allow users to update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
CREATE POLICY "Allow users to insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
CREATE INDEX IF NOT EXISTS idx_customer_contacts_customer_id ON customer_contacts(customer_id);
CREATE INDEX IF NOT EXISTS idx_locations_customer_id ON locations(customer_id);
CREATE INDEX IF NOT EXISTS idx_location_requirements_location_id ON location_requirements(location_id);
CREATE INDEX IF NOT EXISTS idx_location_images_location_id ON location_images(location_id);
CREATE INDEX IF NOT EXISTS idx_location_activity_location_id ON location_activity(location_id);
CREATE INDEX IF NOT EXISTS idx_location_activity_actor_id ON location_activity(actor_id);
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow users to read own profile" ON profiles;
DROP POLICY IF EXISTS "Allow users to update own profile" ON profiles;
DROP POLICY IF EXISTS "Allow users to insert own profile" ON profiles;
CREATE POLICY "Enable read access for users based on user_id"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);
CREATE POLICY "Enable insert for users based on user_id"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
CREATE POLICY "Enable update for users based on user_id"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS location_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL
);
CREATE TABLE IF NOT EXISTS location_comment_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES location_comments(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  file_name text NOT NULL,
  file_size integer DEFAULT 0
);
ALTER TABLE location_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_comment_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to read location_comments"
  ON location_comments
  FOR SELECT
  TO authenticated
  USING (true);
CREATE POLICY "Allow authenticated users to create location_comments"
  ON location_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow users to update own location_comments"
  ON location_comments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow users to delete own location_comments"
  ON location_comments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Allow authenticated users to read location_comment_files"
  ON location_comment_files
  FOR SELECT
  TO authenticated
  USING (true);
CREATE POLICY "Allow authenticated users to manage location_comment_files"
  ON location_comment_files
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_location_comments_location_id ON location_comments(location_id);
CREATE INDEX IF NOT EXISTS idx_location_comments_user_id ON location_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_location_comment_files_comment_id ON location_comment_files(comment_id);
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'location_images' AND column_name = 'description'
  ) THEN
    ALTER TABLE location_images ADD COLUMN description text;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'location_images' AND column_name = 'file_name'
  ) THEN
    ALTER TABLE location_images ADD COLUMN file_name text;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'location_images' AND column_name = 'file_size'
  ) THEN
    ALTER TABLE location_images ADD COLUMN file_size integer DEFAULT 0;
  END IF;
END $$;
CREATE TABLE IF NOT EXISTS location_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL
);
CREATE TABLE IF NOT EXISTS location_comment_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES location_comments(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  file_name text NOT NULL,
  file_size integer DEFAULT 0
);
ALTER TABLE location_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_comment_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to read location_comments"
  ON location_comments
  FOR SELECT
  TO authenticated
  USING (true);
CREATE POLICY "Allow authenticated users to create location_comments"
  ON location_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow users to update own location_comments"
  ON location_comments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow users to delete own location_comments"
  ON location_comments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Allow authenticated users to read location_comment_files"
  ON location_comment_files
  FOR SELECT
  TO authenticated
  USING (true);
CREATE POLICY "Allow authenticated users to manage location_comment_files"
  ON location_comment_files
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_location_comments_location_id ON location_comments(location_id);
CREATE INDEX IF NOT EXISTS idx_location_comments_user_id ON location_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_location_comment_files_comment_id ON location_comment_files(comment_id);
  from joining with profiles to display user information (like full_name).
CREATE POLICY "Allow authenticated users to read all profiles for display"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'location_images' AND column_name = 'description'
  ) THEN
    ALTER TABLE location_images ADD COLUMN description text;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'location_images' AND column_name = 'file_name'
  ) THEN
    ALTER TABLE location_images ADD COLUMN file_name text;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'location_images' AND column_name = 'file_size'
  ) THEN
    ALTER TABLE location_images ADD COLUMN file_size integer DEFAULT 0;
  END IF;
END $$;
CREATE TABLE IF NOT EXISTS location_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL
);
CREATE TABLE IF NOT EXISTS location_comment_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES location_comments(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  file_name text NOT NULL,
  file_size integer DEFAULT 0
);
ALTER TABLE location_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_comment_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to read location_comments"
  ON location_comments
  FOR SELECT
  TO authenticated
  USING (true);
CREATE POLICY "Allow authenticated users to create location_comments"
  ON location_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow users to update own location_comments"
  ON location_comments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow users to delete own location_comments"
  ON location_comments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Allow authenticated users to read location_comment_files"
  ON location_comment_files
  FOR SELECT
  TO authenticated
  USING (true);
CREATE POLICY "Allow authenticated users to manage location_comment_files"
  ON location_comment_files
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_location_comments_location_id ON location_comments(location_id);
CREATE INDEX IF NOT EXISTS idx_location_comments_user_id ON location_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_location_comment_files_comment_id ON location_comment_files(comment_id);
  from joining with profiles to display user information (like full_name).
CREATE POLICY "Allow authenticated users to read all profiles for display"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'location_images' AND column_name = 'description'
  ) THEN
    ALTER TABLE location_images ADD COLUMN description text;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'location_images' AND column_name = 'file_name'
  ) THEN
    ALTER TABLE location_images ADD COLUMN file_name text;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'location_images' AND column_name = 'file_size'
  ) THEN
    ALTER TABLE location_images ADD COLUMN file_size integer DEFAULT 0;
  END IF;
END $$;
  to allow authenticated users to upload, read, and delete files.
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to upload to location-images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'location-images');
CREATE POLICY "Allow authenticated users to read from location-images"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'location-images');
CREATE POLICY "Allow users to delete own files from location-images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'location-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Allow authenticated users to upload to location-files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'location-files');
CREATE POLICY "Allow authenticated users to read from location-files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'location-files');
CREATE POLICY "Allow users to delete own files from location-files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'location-files' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE OR REPLACE FUNCTION public.get_user_by_email(user_email TEXT)
RETURNS TABLE (id uuid, email text)
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.email::text
  FROM auth.users u
  WHERE u.email = user_email;
END;
$$ LANGUAGE plpgsql;
CREATE TABLE IF NOT EXISTS passkey_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge text NOT NULL,
  type text NOT NULL CHECK (type IN ('registration', 'authentication')),
  expires_at timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS passkeys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_id text NOT NULL UNIQUE,
  public_key text NOT NULL,
  counter bigint DEFAULT 0,
  display_name text,
  email text,
  last_used_at timestamptz
);
ALTER TABLE passkey_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE passkeys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to manage their own challenges"
  ON passkey_challenges
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow authenticated users to read their own passkeys"
  ON passkeys
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Allow authenticated users to manage their own passkeys"
  ON passkeys
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_passkey_challenges_user_id ON passkey_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_passkey_challenges_challenge ON passkey_challenges(challenge);
CREATE INDEX IF NOT EXISTS idx_passkey_challenges_expires_at ON passkey_challenges(expires_at);
CREATE INDEX IF NOT EXISTS idx_passkeys_user_id ON passkeys(user_id);
CREATE INDEX IF NOT EXISTS idx_passkeys_credential_id ON passkeys(credential_id);
  This migration creates a helper function to get a user by ID,
CREATE OR REPLACE FUNCTION public.get_user_by_email_and_id(user_id UUID)
RETURNS TABLE (id uuid, email text)
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.email::text
  FROM auth.users u
  WHERE u.id = user_id;
END;
$$ LANGUAGE plpgsql;@@ .. @@
 CREATE OR REPLACE FUNCTION public.get_user_by_email_and_id(user_id UUID)
 RETURNS TABLE (id uuid, email text)
 SECURITY DEFINER
 SET search_path = ''
 AS $$
 BEGIN
   RETURN QUERY
   SELECT u.id, u.email::text
   FROM auth.users u
   WHERE u.id = user_id;
 END;
 $$ LANGUAGE plpgsql;
CREATE TABLE IF NOT EXISTS location_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE location_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to read location_assignments"
  ON location_assignments
  FOR SELECT
  TO authenticated
  USING (true);
CREATE POLICY "Allow admins to manage location_assignments"
  ON location_assignments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
DROP POLICY IF EXISTS "Allow authenticated users to read locations" ON locations;
DROP POLICY IF EXISTS "Allow authenticated users to manage locations" ON locations;
CREATE POLICY "Role-based location access"
  ON locations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR
    EXISTS (
      SELECT 1 FROM location_assignments
      WHERE location_id = locations.id AND user_id = auth.uid()
    )
  );
CREATE POLICY "Allow admins to manage locations"
  ON locations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
DROP POLICY IF EXISTS "Allow authenticated users to read location_requirements" ON location_requirements;
DROP POLICY IF EXISTS "Allow authenticated users to manage location_requirements" ON location_requirements;
CREATE POLICY "Role-based location_requirements access"
  ON location_requirements
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR
    EXISTS (
      SELECT 1 FROM location_assignments
      WHERE location_id = location_requirements.location_id AND user_id = auth.uid()
    )
  );
CREATE POLICY "Role-based location_requirements management"
  ON location_requirements
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR
    EXISTS (
      SELECT 1 FROM location_assignments
      WHERE location_id = location_requirements.location_id AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR
    EXISTS (
      SELECT 1 FROM location_assignments
      WHERE location_id = location_requirements.location_id AND user_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "Allow authenticated users to read location_images" ON location_images;
DROP POLICY IF EXISTS "Allow authenticated users to manage location_images" ON location_images;
CREATE POLICY "Role-based location_images access"
  ON location_images
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR
    EXISTS (
      SELECT 1 FROM location_assignments
      WHERE location_id = location_images.location_id AND user_id = auth.uid()
    )
  );
CREATE POLICY "Role-based location_images management"
  ON location_images
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR
    EXISTS (
      SELECT 1 FROM location_assignments
      WHERE location_id = location_images.location_id AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR
    EXISTS (
      SELECT 1 FROM location_assignments
      WHERE location_id = location_images.location_id AND user_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "Allow authenticated users to read location_activity" ON location_activity;
DROP POLICY IF EXISTS "Allow authenticated users to create location_activity" ON location_activity;
CREATE POLICY "Role-based location_activity access"
  ON location_activity
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR
    EXISTS (
      SELECT 1 FROM location_assignments
      WHERE location_id = location_activity.location_id AND user_id = auth.uid()
    )
  );
CREATE POLICY "Role-based location_activity creation"
  ON location_activity
  FOR INSERT
  TO authenticated
  WITH CHECK (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
      )
      OR
      EXISTS (
        SELECT 1 FROM location_assignments
        WHERE location_id = location_activity.location_id AND user_id = auth.uid()
      )
    )
  );
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'location_comments') THEN
    DROP POLICY IF EXISTS "Allow authenticated users to read location_comments" ON location_comments;
    DROP POLICY IF EXISTS "Allow authenticated users to create location_comments" ON location_comments;
    DROP POLICY IF EXISTS "Allow users to update own location_comments" ON location_comments;
    DROP POLICY IF EXISTS "Allow users to delete own location_comments" ON location_comments;
    CREATE POLICY "Role-based location_comments access"
      ON location_comments
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid() AND role = 'admin'
        )
        OR
        EXISTS (
          SELECT 1 FROM location_assignments
          WHERE location_id = location_comments.location_id AND user_id = auth.uid()
        )
      );
    CREATE POLICY "Role-based location_comments creation"
      ON location_comments
      FOR INSERT
      TO authenticated
      WITH CHECK (
          EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
          )
          OR
          EXISTS (
            SELECT 1 FROM location_assignments
            WHERE location_id = location_comments.location_id AND user_id = auth.uid()
          )
        )
      );
    CREATE POLICY "Allow users to update own location_comments"
      ON location_comments
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Allow users to delete own location_comments"
      ON location_comments
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_location_assignments_location_id ON location_assignments(location_id);
CREATE INDEX IF NOT EXISTS idx_location_assignments_user_id ON location_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_location_assignments_assigned_by ON location_assignments(assigned_by);
  to work with foreign key constraints.
CREATE OR REPLACE FUNCTION public.get_user_by_email(user_email TEXT)
RETURNS TABLE (id uuid, email text)
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.email::text
  FROM auth.users u
  WHERE u.email = user_email
    AND u.email_confirmed_at IS NOT NULL
    AND u.deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;
  (using service role key) to insert, read, and delete passkey challenges.
CREATE POLICY "Allow service role to manage passkey_challenges"
  ON passkey_challenges
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
CREATE POLICY "Allow authenticated users to manage own passkey_challenges"
  ON passkey_challenges
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
  (using service role key) to insert, read, and delete passkey challenges.
CREATE POLICY "Allow service role to manage passkey_challenges"
  ON passkey_challenges
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
CREATE POLICY "Allow authenticated users to manage own passkey_challenges"
  ON passkey_challenges
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'locations' AND column_name = 'locker_number'
  ) THEN
    ALTER TABLE locations ADD COLUMN locker_number text;
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'locations' AND column_name = 'status'
  ) THEN
    ALTER TABLE locations DROP COLUMN status;
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'location_status') THEN
    DROP TYPE IF EXISTS location_status;
  END IF;
END $$;
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL
);
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN company_id uuid REFERENCES companies(id) ON DELETE SET NULL;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE customers ADD COLUMN company_id uuid REFERENCES companies(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'locations' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE locations ADD COLUMN company_id uuid REFERENCES companies(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'location_assignments' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE location_assignments ADD COLUMN company_id uuid REFERENCES companies(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'location_requirements' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE location_requirements ADD COLUMN company_id uuid REFERENCES companies(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'location_images' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE location_images ADD COLUMN company_id uuid REFERENCES companies(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'location_activity' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE location_activity ADD COLUMN company_id uuid REFERENCES companies(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'location_comments'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'location_comments' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE location_comments ADD COLUMN company_id uuid REFERENCES companies(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'location_comment_files'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'location_comment_files' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE location_comment_files ADD COLUMN company_id uuid REFERENCES companies(id) ON DELETE CASCADE;
  END IF;
END $$;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their own company"
  ON companies
  FOR SELECT
  TO authenticated
  USING (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );
CREATE POLICY "Users can update their own company"
  ON companies
  FOR UPDATE
  TO authenticated
  USING (
      SELECT company_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
      SELECT company_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );
CREATE POLICY "Authenticated users can create companies"
  ON companies
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_company_id uuid;
BEGIN
  user_company_id := (new.raw_user_meta_data->>'company_id')::uuid;
  INSERT INTO public.profiles (id, email, full_name, role, company_id)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    'technician'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_customers_company_id ON customers(company_id);
CREATE INDEX IF NOT EXISTS idx_locations_company_id ON locations(company_id);
CREATE INDEX IF NOT EXISTS idx_location_assignments_company_id ON location_assignments(company_id);
CREATE INDEX IF NOT EXISTS idx_location_requirements_company_id ON location_requirements(company_id);
CREATE INDEX IF NOT EXISTS idx_location_images_company_id ON location_images(company_id);
CREATE INDEX IF NOT EXISTS idx_location_activity_company_id ON location_activity(company_id);
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'location_comments') THEN
    CREATE INDEX IF NOT EXISTS idx_location_comments_company_id ON location_comments(company_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'location_comment_files') THEN
    CREATE INDEX IF NOT EXISTS idx_location_comment_files_company_id ON location_comment_files(company_id);
  END IF;
END $$;
  The profiles table has `onboarding_completed` defaulting to `true`, 
ALTER TABLE profiles 
  ALTER COLUMN onboarding_completed SET DEFAULT false;
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);
  or missing proper default handling when no metadata is provided.
  Update the function to:
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_company_id uuid;
  user_role user_role;
  user_full_name text;
  invite_record record;
BEGIN
  user_company_id := (NEW.raw_user_meta_data->>'company_id')::uuid;
  IF NEW.raw_user_meta_data->>'role' IS NOT NULL AND 
    user_role := (NEW.raw_user_meta_data->>'role')::user_role;
  ELSE
    user_role := 'employee'::user_role;
  END IF;
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), '')
  );
  IF user_company_id IS NULL THEN
    SELECT company_id, role INTO invite_record
    FROM company_invitations
    WHERE email = NEW.email 
    AND status = 'pending'
    AND expires_at > now()
    LIMIT 1;
    IF FOUND THEN
      user_company_id := invite_record.company_id;
      user_role := invite_record.role;
      UPDATE company_invitations
      SET status = 'accepted', accepted_at = now(), accepted_by = NEW.id
      WHERE email = NEW.email AND status = 'pending';
    END IF;
  END IF;
  INSERT INTO public.profiles (id, email, full_name, role, company_id, onboarding_completed)
  VALUES (
    NEW.id, 
    NEW.email, 
    user_full_name,
    user_role,
    user_company_id
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_user: % %', SQLERRM, SQLSTATE;
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
  function tries to insert an empty string, which violates this constraint.
ALTER TABLE profiles 
  ALTER COLUMN full_name DROP NOT NULL;
  This allows users to sign up without providing a name,
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_company_id uuid;
  user_role user_role;
  user_full_name text;
  invite_record record;
BEGIN
  user_company_id := (NEW.raw_user_meta_data->>'company_id')::uuid;
  IF NEW.raw_user_meta_data->>'role' IS NOT NULL AND 
    user_role := (NEW.raw_user_meta_data->>'role')::user_role;
  ELSE
    user_role := 'employee'::user_role;
  END IF;
  user_full_name := NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'full_name', '')), '');
  IF user_company_id IS NULL THEN
    SELECT company_id, role INTO invite_record
    FROM company_invitations
    WHERE email = NEW.email 
    AND status = 'pending'
    AND expires_at > now()
    LIMIT 1;
    IF FOUND THEN
      user_company_id := invite_record.company_id;
      user_role := invite_record.role;
      UPDATE company_invitations
      SET status = 'accepted', accepted_at = now(), accepted_by = NEW.id
      WHERE email = NEW.email AND status = 'pending';
    END IF;
  END IF;
  INSERT INTO public.profiles (id, email, full_name, role, company_id, onboarding_completed)
  VALUES (
    NEW.id, 
    NEW.email, 
    user_full_name,
    user_role,
    user_company_id
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_user: % %', SQLERRM, SQLSTATE;
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
  to ensure it's working properly. We'll also set the search_path for security.
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
CREATE FUNCTION public.handle_new_user()
RETURNS trigger 
SECURITY DEFINER 
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
DECLARE
  user_company_id uuid;
  user_role user_role;
  user_full_name text;
  invite_record record;
BEGIN
  user_company_id := (NEW.raw_user_meta_data->>'company_id')::uuid;
  IF NEW.raw_user_meta_data->>'role' IS NOT NULL AND 
    user_role := (NEW.raw_user_meta_data->>'role')::user_role;
  ELSE
    user_role := 'employee'::user_role;
  END IF;
  user_full_name := NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'full_name', '')), '');
  IF user_company_id IS NULL THEN
    SELECT company_id, role INTO invite_record
    FROM company_invitations
    WHERE email = NEW.email 
    AND status = 'pending'
    AND expires_at > now()
    LIMIT 1;
    IF FOUND THEN
      user_company_id := invite_record.company_id;
      user_role := invite_record.role;
      UPDATE company_invitations
      SET status = 'accepted', accepted_at = now(), accepted_by = NEW.id
      WHERE email = NEW.email AND status = 'pending';
    END IF;
  END IF;
  INSERT INTO public.profiles (id, email, full_name, role, company_id, onboarding_completed)
  VALUES (
    NEW.id, 
    NEW.email, 
    user_full_name,
    user_role,
    user_company_id
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_user: % %', SQLERRM, SQLSTATE;
    RAISE;
END;
$$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
CREATE POLICY "Service role can insert profiles"
  ON profiles
  FOR INSERT
  TO service_role
  WITH CHECK (true);
  Drop the restrictive INSERT policy and replace it with one that allows:
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users and triggers can insert profiles"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
  );
CREATE POLICY "Allow profile creation during signup"
  ON profiles
  FOR INSERT
  TO public
  WITH CHECK (
  );
  Grant BYPASSRLS to the postgres user (who owns the function), and ensure the
  function can successfully insert profiles during signup.
DROP POLICY IF EXISTS "Users and triggers can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation during signup" ON profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;
CREATE POLICY "Allow system to create profiles during signup"
  ON profiles
  FOR INSERT
  WITH CHECK (true);
DROP POLICY IF EXISTS "Allow system to create profiles during signup" ON profiles;
CREATE POLICY "Users can insert own profile during signup"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
  According to Supabase best practices, when a trigger handles profile creation,
  DEFINER will bypass RLS entirely.
DROP POLICY IF EXISTS "Users can insert own profile during signup" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Allow users to insert own profile" ON profiles;
-- No INSERT policy needed - the trigger handles all profile creation
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL
);
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN company_id uuid REFERENCES companies(id) ON DELETE SET NULL;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE customers ADD COLUMN company_id uuid REFERENCES companies(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'locations' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE locations ADD COLUMN company_id uuid REFERENCES companies(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'location_assignments' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE location_assignments ADD COLUMN company_id uuid REFERENCES companies(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'location_requirements' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE location_requirements ADD COLUMN company_id uuid REFERENCES companies(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'location_images' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE location_images ADD COLUMN company_id uuid REFERENCES companies(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'location_activity' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE location_activity ADD COLUMN company_id uuid REFERENCES companies(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'location_comments'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'location_comments' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE location_comments ADD COLUMN company_id uuid REFERENCES companies(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'location_comment_files'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'location_comment_files' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE location_comment_files ADD COLUMN company_id uuid REFERENCES companies(id) ON DELETE CASCADE;
  END IF;
END $$;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their own company"
  ON companies
  FOR SELECT
  TO authenticated
  USING (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );
CREATE POLICY "Users can update their own company"
  ON companies
  FOR UPDATE
  TO authenticated
  USING (
      SELECT company_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
      SELECT company_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );
CREATE POLICY "Authenticated users can create companies"
  ON companies
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_company_id uuid;
BEGIN
  user_company_id := (new.raw_user_meta_data->>'company_id')::uuid;
  INSERT INTO public.profiles (id, email, full_name, role, company_id)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    'technician'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_customers_company_id ON customers(company_id);
CREATE INDEX IF NOT EXISTS idx_locations_company_id ON locations(company_id);
CREATE INDEX IF NOT EXISTS idx_location_assignments_company_id ON location_assignments(company_id);
CREATE INDEX IF NOT EXISTS idx_location_requirements_company_id ON location_requirements(company_id);
CREATE INDEX IF NOT EXISTS idx_location_images_company_id ON location_images(company_id);
CREATE INDEX IF NOT EXISTS idx_location_activity_company_id ON location_activity(company_id);
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'location_comments') THEN
    CREATE INDEX IF NOT EXISTS idx_location_comments_company_id ON location_comments(company_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'location_comment_files') THEN
    CREATE INDEX IF NOT EXISTS idx_location_comment_files_company_id ON location_comment_files(company_id);
  END IF;
END $$;
  The profiles table has `onboarding_completed` defaulting to `true`, 
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'onboarding_completed'
  ) THEN
    ALTER TABLE profiles ADD COLUMN onboarding_completed boolean DEFAULT false;
  END IF;
END $$;
ALTER TABLE profiles 
  ALTER COLUMN onboarding_completed SET DEFAULT false;
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'customer_responsible' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')) THEN
        ALTER TYPE user_role ADD VALUE 'customer_responsible';
    END IF;
END $$;
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'location_responsible' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')) THEN
        ALTER TYPE user_role ADD VALUE 'location_responsible';
    END IF;
END $$;
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'employee' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')) THEN
        ALTER TYPE user_role ADD VALUE 'employee';
    END IF;
END $$;
CREATE TABLE IF NOT EXISTS company_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  email text NOT NULL,
  role user_role NOT NULL DEFAULT 'employee',
  invite_code text UNIQUE NOT NULL,
  invite_type text DEFAULT 'email' CHECK (invite_type IN ('email', 'code')),
  expires_at timestamptz NOT NULL,
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  accepted_at timestamptz,
  accepted_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled'))
);
ALTER TABLE company_invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read invitations for their company"
  ON company_invitations
  FOR SELECT
  TO authenticated
  USING (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );
CREATE POLICY "Users can create invitations for their company"
  ON company_invitations
  FOR INSERT
  TO authenticated
  WITH CHECK (
      SELECT company_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'customer_responsible')
    )
  );
CREATE POLICY "Users can update invitations for their company"
  ON company_invitations
  FOR UPDATE
  TO authenticated
  USING (
      SELECT company_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'customer_responsible')
    )
  )
  WITH CHECK (
      SELECT company_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'customer_responsible')
    )
  );
CREATE TABLE IF NOT EXISTS company_join_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  code text UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'employee',
  max_uses integer,
  current_uses integer DEFAULT 0,
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE
);
ALTER TABLE company_join_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read join codes for their company"
  ON company_join_codes
  FOR SELECT
  TO authenticated
  USING (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );
CREATE POLICY "Users can create join codes for their company"
  ON company_join_codes
  FOR INSERT
  TO authenticated
  WITH CHECK (
      SELECT company_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'customer_responsible')
    )
  );
CREATE POLICY "Users can update join codes for their company"
  ON company_join_codes
  FOR UPDATE
  TO authenticated
  USING (
      SELECT company_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'customer_responsible')
    )
  )
  WITH CHECK (
      SELECT company_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'customer_responsible')
    )
  );
CREATE TABLE IF NOT EXISTS company_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  old_values jsonb,
  new_values jsonb
);
ALTER TABLE company_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read audit log for their company"
  ON company_audit_log
  FOR SELECT
  TO authenticated
  USING (
      SELECT company_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );
CREATE INDEX IF NOT EXISTS idx_company_invitations_company_id ON company_invitations(company_id);
CREATE INDEX IF NOT EXISTS idx_company_invitations_email ON company_invitations(email);
CREATE INDEX IF NOT EXISTS idx_company_invitations_invite_code ON company_invitations(invite_code);
CREATE INDEX IF NOT EXISTS idx_company_join_codes_company_id ON company_join_codes(company_id);
CREATE INDEX IF NOT EXISTS idx_company_join_codes_code ON company_join_codes(code);
CREATE INDEX IF NOT EXISTS idx_company_audit_log_company_id ON company_audit_log(company_id);
  to ensure it's working properly. We'll also set the search_path for security.
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
CREATE FUNCTION public.handle_new_user()
RETURNS trigger 
SECURITY DEFINER 
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
DECLARE
  user_company_id uuid;
  user_role user_role;
  user_full_name text;
  invite_record record;
BEGIN
  user_company_id := (NEW.raw_user_meta_data->>'company_id')::uuid;
  IF NEW.raw_user_meta_data->>'role' IS NOT NULL AND 
    user_role := (NEW.raw_user_meta_data->>'role')::user_role;
  ELSE
    user_role := 'employee'::user_role;
  END IF;
  user_full_name := NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'full_name', '')), '');
  IF user_company_id IS NULL THEN
    SELECT company_id, role INTO invite_record
    FROM company_invitations
    WHERE email = NEW.email 
    AND status = 'pending'
    AND expires_at > now()
    LIMIT 1;
    IF FOUND THEN
      user_company_id := invite_record.company_id;
      user_role := invite_record.role;
      UPDATE company_invitations
      SET status = 'accepted', accepted_at = now(), accepted_by = NEW.id
      WHERE email = NEW.email AND status = 'pending';
    END IF;
  END IF;
  INSERT INTO public.profiles (id, email, full_name, role, company_id, onboarding_completed)
  VALUES (
    NEW.id, 
    NEW.email, 
    user_full_name,
    user_role,
    user_company_id
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_user: % %', SQLERRM, SQLSTATE;
    RAISE;
END;
$$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
DO $$
DECLARE
  weibel_company_id uuid;
  first_user_id uuid;
BEGIN
  SELECT id INTO weibel_company_id FROM companies WHERE name = 'Weibel' LIMIT 1;
  IF weibel_company_id IS NULL THEN
    INSERT INTO companies (name, created_at)
    RETURNING id INTO weibel_company_id;
    RAISE NOTICE 'Created Weibel company with id: %', weibel_company_id;
  ELSE
    RAISE NOTICE 'Weibel company already exists with id: %', weibel_company_id;
  END IF;
  UPDATE profiles 
  SET company_id = weibel_company_id,
  WHERE company_id IS NULL;
  RAISE NOTICE 'Updated % profiles to Weibel company', (SELECT COUNT(*) FROM profiles WHERE company_id = weibel_company_id);
  SELECT id INTO first_user_id 
  FROM profiles 
  WHERE company_id = weibel_company_id 
  LIMIT 1;
  IF first_user_id IS NOT NULL THEN
    UPDATE profiles 
    SET role = 'admin' 
    WHERE id = first_user_id;
    RAISE NOTICE 'Set user % as admin', first_user_id;
  END IF;
  UPDATE customers 
  SET company_id = weibel_company_id
  WHERE company_id IS NULL;
  RAISE NOTICE 'Updated % customers to Weibel company', (SELECT COUNT(*) FROM customers WHERE company_id = weibel_company_id);
  UPDATE locations 
  SET company_id = weibel_company_id
  WHERE company_id IS NULL;
  RAISE NOTICE 'Updated % locations to Weibel company', (SELECT COUNT(*) FROM locations WHERE company_id = weibel_company_id);
  UPDATE location_assignments 
  SET company_id = weibel_company_id
  WHERE company_id IS NULL;
  UPDATE location_requirements 
  SET company_id = weibel_company_id
  WHERE company_id IS NULL;
  UPDATE location_images 
  SET company_id = weibel_company_id
  WHERE company_id IS NULL;
  UPDATE location_activity 
  SET company_id = weibel_company_id
  WHERE company_id IS NULL;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'location_comments') THEN
    UPDATE location_comments 
    SET company_id = weibel_company_id
    WHERE company_id IS NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'location_comment_files') THEN
    UPDATE location_comment_files 
    SET company_id = weibel_company_id
    WHERE company_id IS NULL;
  END IF;
  RAISE NOTICE 'Successfully completed Weibel company data migration';
END $$;
CREATE OR REPLACE FUNCTION public.validate_join_code(code_input text)
RETURNS TABLE (
  is_valid boolean,
  company_id uuid,
  role text,
  company_name text,
  expires_at timestamptz,
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
        AND (jc.max_uses IS NULL OR jc.current_uses < jc.max_uses)
        AND jc.is_active = true
    END as is_valid,
    jc.company_id,
    jc.role::text,
    c.name as company_name,
    jc.expires_at,
    CASE 
    END as uses_remaining
  FROM company_join_codes jc
  WHERE UPPER(jc.code) = UPPER(code_input)
    AND jc.is_active = true
  LIMIT 1;
END;
$$;
CREATE OR REPLACE FUNCTION public.increment_join_code_usage(code_input text)
RETURNS boolean
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  code_exists boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1 
    FROM company_join_codes 
    WHERE UPPER(code) = UPPER(code_input)
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > now())
      AND (max_uses IS NULL OR current_uses < max_uses)
  ) INTO code_exists;
  IF NOT code_exists THEN
    RETURN false;
  END IF;
  UPDATE company_join_codes
  SET current_uses = current_uses + 1
  WHERE UPPER(code) = UPPER(code_input)
    AND is_active = true;
  RETURN true;
END;
$$;
GRANT EXECUTE ON FUNCTION public.validate_join_code(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_join_code_usage(text) TO authenticated;
CREATE INDEX IF NOT EXISTS idx_company_join_codes_code_upper ON company_join_codes(UPPER(code));
CREATE INDEX IF NOT EXISTS idx_company_join_codes_active ON company_join_codes(is_active, expires_at) WHERE is_active = true;
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, onboarding_completed, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NULL),
    false,
    NOW()
  );
  RETURN NEW;
END;
$$;
CREATE OR REPLACE FUNCTION public.check_incomplete_registration(user_id_input uuid)
RETURNS TABLE (
  has_profile boolean,
  has_company boolean,
  company_name text,
  email_confirmed boolean,
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_record RECORD;
  company_record RECORD;
  user_record RECORD;
BEGIN
  SELECT
  FROM auth.users
  WHERE id = user_id_input;
  SELECT
    p.company_id,
  FROM profiles p
  WHERE p.id = user_id_input;
  IF profile_record.company_id IS NOT NULL THEN
    SELECT c.name
    FROM companies c
    WHERE c.id = profile_record.company_id;
  END IF;
  RETURN QUERY SELECT
    profile_record IS NOT NULL as has_profile,
    company_record IS NOT NULL as has_company,
    company_record.name as company_name,
    COALESCE(user_record.is_confirmed, false) as email_confirmed,
    COALESCE(profile_record.onboarding_completed, false) as onboarding_completed;
END;
$$;
CREATE INDEX IF NOT EXISTS idx_profiles_company_onboarding
ON profiles(company_id, onboarding_completed)
WHERE company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_created_at
ON profiles(created_at);
GRANT EXECUTE ON FUNCTION check_incomplete_registration TO authenticated;
DROP POLICY IF EXISTS "Authenticated users can create companies" ON companies;
CREATE POLICY "Authenticated users can create companies"
  ON companies
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
CREATE OR REPLACE FUNCTION public.complete_company_registration(
  user_id_param uuid,
  company_id_param uuid,
  full_name_param text,
  phone_param text,
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_profile profiles%ROWTYPE;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user_id_param) THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = user_id_param) THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM companies WHERE id = company_id_param) THEN
    RAISE EXCEPTION 'Company not found';
  END IF;
  UPDATE profiles
  SET 
    full_name = full_name_param,
    phone = phone_param,
    company_id = company_id_param,
    role = role_param,
  WHERE id = user_id_param
  RETURNING * INTO updated_profile;
  RETURN row_to_json(updated_profile);
END;
$$;
GRANT EXECUTE ON FUNCTION complete_company_registration TO authenticated;
COMMENT ON FUNCTION complete_company_registration IS 'Completes company registration by updating user profile with company association';
CREATE OR REPLACE FUNCTION public.generate_invite_code(length integer DEFAULT 8)
RETURNS text
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i integer;
  chars_length integer;
BEGIN
  IF length < 4 OR length > 32 THEN
    RAISE EXCEPTION 'Code length must be between 4 and 32 characters';
  END IF;
  chars_length := length(chars);
  FOR i IN 1..length LOOP
    result := result || substr(chars, floor(random() * chars_length + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;
GRANT EXECUTE ON FUNCTION public.generate_invite_code(integer) TO authenticated;
COMMENT ON FUNCTION public.generate_invite_code(integer) IS 
  'Generates a random alphanumeric code of specified length. Uses uppercase letters and numbers 2-9, excluding confusing characters like 0, 1, O, I.';
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'logo_url'
  ) THEN
    ALTER TABLE companies ADD COLUMN logo_url text;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_companies_logo_url ON companies(logo_url) WHERE logo_url IS NOT NULL;
COMMENT ON COLUMN companies.logo_url IS 'URL to company logo stored in Supabase Storage';
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('admin', 'technician');
    RAISE NOTICE 'Created user_role enum type';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'customer_responsible' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')) THEN
    ALTER TYPE user_role ADD VALUE 'customer_responsible';
    RAISE NOTICE 'Added customer_responsible to user_role enum';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'location_responsible' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')) THEN
    ALTER TYPE user_role ADD VALUE 'location_responsible';
    RAISE NOTICE 'Added location_responsible to user_role enum';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'employee' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')) THEN
    ALTER TYPE user_role ADD VALUE 'employee';
    RAISE NOTICE 'Added employee to user_role enum';
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'profiles' AND column_name = 'email'
    ) THEN
      ALTER TABLE profiles ADD COLUMN email text NOT NULL;
      RAISE NOTICE 'Added email column to profiles table';
    END IF;
  ELSE
    RAISE NOTICE 'Profiles table does not exist - it should be created by Supabase or earlier migration';
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'company_audit_log') THEN
    DROP POLICY IF EXISTS "Users can insert audit log for their company" ON company_audit_log;
    DROP POLICY IF EXISTS "Allow users to create audit logs" ON company_audit_log;
    DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON company_audit_log;
    CREATE POLICY "Authenticated users can insert audit logs"
      ON company_audit_log
      FOR INSERT
      TO authenticated
      WITH CHECK (
      );
    RAISE NOTICE 'Added INSERT policy to company_audit_log table';
  ELSE
    RAISE NOTICE 'company_audit_log table does not exist - it should be created by earlier migration';
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'company_invitations') THEN
    RAISE NOTICE 'company_invitations table does not exist - this may cause handle_new_user trigger to fail';
  ELSE
    RAISE NOTICE 'company_invitations table exists';
  END IF;
END $$;
COMMENT ON POLICY "Authenticated users can insert audit logs" ON company_audit_log IS
  'Allows authenticated users to insert audit log entries for their own actions during company registration and other operations';
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('admin', 'technician');
    RAISE NOTICE 'Created user_role enum type';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'customer_responsible' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')) THEN
    ALTER TYPE user_role ADD VALUE 'customer_responsible';
    RAISE NOTICE 'Added customer_responsible to user_role enum';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'location_responsible' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')) THEN
    ALTER TYPE user_role ADD VALUE 'location_responsible';
    RAISE NOTICE 'Added location_responsible to user_role enum';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'employee' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')) THEN
    ALTER TYPE user_role ADD VALUE 'employee';
    RAISE NOTICE 'Added employee to user_role enum';
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'profiles' AND column_name = 'email'
    ) THEN
      ALTER TABLE profiles ADD COLUMN email text NOT NULL;
      RAISE NOTICE 'Added email column to profiles table';
    END IF;
  ELSE
    RAISE NOTICE 'Profiles table does not exist - it should be created by Supabase or earlier migration';
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'company_audit_log') THEN
    DROP POLICY IF EXISTS "Users can insert audit log for their company" ON company_audit_log;
    DROP POLICY IF EXISTS "Allow users to create audit logs" ON company_audit_log;
    DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON company_audit_log;
    CREATE POLICY "Authenticated users can insert audit logs"
      ON company_audit_log
      FOR INSERT
      TO authenticated
      WITH CHECK (
      );
    RAISE NOTICE 'Added INSERT policy to company_audit_log table';
  ELSE
    RAISE NOTICE 'company_audit_log table does not exist - it should be created by earlier migration';
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'company_invitations') THEN
    RAISE NOTICE 'company_invitations table does not exist - this may cause handle_new_user trigger to fail';
  ELSE
    RAISE NOTICE 'company_invitations table exists';
  END IF;
END $$;
COMMENT ON POLICY "Authenticated users can insert audit logs" ON company_audit_log IS
  'Allows authenticated users to insert audit log entries for their own actions during company registration and other operations';
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
DECLARE
  user_company_id uuid;
  user_role user_role;
  user_full_name text;
  invite_record record;
BEGIN
  user_company_id := (NEW.raw_user_meta_data->>'company_id')::uuid;
  IF NEW.raw_user_meta_data->>'role' IS NOT NULL AND
    user_role := (NEW.raw_user_meta_data->>'role')::user_role;
  ELSE
    user_role := 'employee'::user_role;
  END IF;
    NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'full_name', '')), '')
  );
  IF user_company_id IS NULL THEN
    SELECT company_id, role INTO invite_record
    FROM company_invitations
    WHERE email = NEW.email
    AND status = 'pending'
    AND expires_at > now()
    LIMIT 1;
    IF FOUND THEN
      user_company_id := invite_record.company_id;
      user_role := invite_record.role;
      UPDATE company_invitations
      SET status = 'accepted', accepted_at = now(), accepted_by = NEW.id
      WHERE email = NEW.email AND status = 'pending';
    END IF;
  END IF;
  INSERT INTO public.profiles (id, email, full_name, role, company_id, onboarding_completed)
  VALUES (
    NEW.id,
    NEW.email,
    user_full_name,
    user_role,
    user_company_id
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_user: % %', SQLERRM, SQLSTATE;
    RAISE;
END;
$$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
COMMENT ON FUNCTION public.handle_new_user IS
  'Trigger function that creates a profile entry when a new user signs up. Handles NULL values properly for NOT NULL columns.';
CREATE POLICY "Service role can update invitations for acceptance"
  ON company_invitations
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);
COMMENT ON POLICY "Service role can update invitations for acceptance" ON company_invitations IS
  'Allows the handle_new_user trigger function (running as service_role/SECURITY DEFINER) to mark invitations as accepted during user signup.';
ALTER FUNCTION public.handle_new_user() SECURITY DEFINER;
GRANT ALL ON TABLE public.profiles TO postgres;
GRANT USAGE ON SCHEMA public TO postgres;
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
DECLARE
  user_company_id uuid;
  user_role user_role;
  user_full_name text;
  invite_record record;
BEGIN
  user_company_id := (NEW.raw_user_meta_data->>'company_id')::uuid;
  IF NEW.raw_user_meta_data->>'role' IS NOT NULL AND
    user_role := (NEW.raw_user_meta_data->>'role')::user_role;
  ELSE
    user_role := 'employee'::user_role;
  END IF;
    NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'full_name', '')), '')
  );
  IF user_company_id IS NULL THEN
    SELECT company_id, role INTO invite_record
    FROM company_invitations
    WHERE email = NEW.email
    AND status = 'pending'
    AND expires_at > now()
    LIMIT 1;
    IF FOUND THEN
      user_company_id := invite_record.company_id;
      user_role := invite_record.role;
      UPDATE company_invitations
      SET status = 'accepted', accepted_at = now(), accepted_by = NEW.id
      WHERE email = NEW.email AND status = 'pending';
    END IF;
  END IF;
  INSERT INTO public.profiles (id, email, full_name, role, company_id, onboarding_completed)
  VALUES (
    NEW.id,
    NEW.email,
    user_full_name,
    user_role,
    user_company_id
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_user: % %', SQLERRM, SQLSTATE;
    RAISE;
END;
$$;
COMMENT ON FUNCTION public.handle_new_user IS
  'Trigger function with SECURITY DEFINER that bypasses RLS to create profile entries for new users during signup.';
CREATE POLICY "Service role can update invitations for acceptance"
  ON company_invitations
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);
COMMENT ON POLICY "Service role can update invitations for acceptance" ON company_invitations IS
  'Allows the handle_new_user trigger function (running as service_role/SECURITY DEFINER) to mark invitations as accepted during user signup.';
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_manual_creation'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_manual_creation boolean DEFAULT false;
  END IF;
END $$;
CREATE OR REPLACE FUNCTION create_manual_employee(
  p_full_name text,
  p_email text,
  p_role user_role,
  p_phone text DEFAULT NULL,
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id uuid;
  v_caller_role user_role;
  v_new_profile_id uuid;
  v_location_id uuid;
  v_result json;
BEGIN
  SELECT company_id, role INTO v_company_id, v_caller_role
  FROM profiles
  WHERE id = auth.uid();
  IF v_caller_role NOT IN ('admin', 'customer_responsible') THEN
    RAISE EXCEPTION 'Kun administratorer og kunde ansvarlige kan oprette medarbejdere manuelt';
  END IF;
  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Bruger har ingen tilknyttet virksomhed';
  END IF;
  IF EXISTS (SELECT 1 FROM profiles WHERE email = LOWER(p_email)) THEN
    RAISE EXCEPTION 'Email er allerede i brug';
  END IF;
  v_new_profile_id := gen_random_uuid();
  INSERT INTO profiles (
    id,
    email,
    full_name,
    phone,
    role,
    company_id,
    onboarding_completed,
  ) VALUES (
    v_new_profile_id,
    LOWER(p_email),
    p_full_name,
    p_phone,
    p_role,
    v_company_id
  );
  IF array_length(p_location_ids, 1) > 0 THEN
    LOOP
      IF NOT EXISTS (
        SELECT 1 FROM locations
        WHERE id = v_location_id AND company_id = v_company_id
      ) THEN
        RAISE EXCEPTION 'Lokation eksisterer ikke eller tilhører ikke virksomheden';
      END IF;
      INSERT INTO location_assignments (
        location_id,
        user_id,
      ) VALUES (
        v_location_id,
        v_new_profile_id
      );
    END LOOP;
  END IF;
  INSERT INTO company_audit_log (
    company_id,
    user_id,
    action,
  ) VALUES (
    v_company_id,
    auth.uid(),
    'create_manual_employee',
      'employee_id', v_new_profile_id,
      'employee_email', p_email,
      'employee_name', p_full_name,
      'role', p_role,
    )
  );
  SELECT json_build_object(
    'id', p.id,
    'email', p.email,
    'full_name', p.full_name,
    'phone', p.phone,
    'role', p.role,
    'company_id', p.company_id,
    'created_at', p.created_at,
      SELECT COUNT(*)
      FROM location_assignments
      WHERE user_id = p.id
    )
  )
  FROM profiles p
  WHERE p.id = v_new_profile_id;
  RETURN v_result;
END;
$$;
GRANT EXECUTE ON FUNCTION create_manual_employee TO authenticated;
COMMENT ON FUNCTION create_manual_employee IS
  'Creates a new employee profile manually without requiring auth.signUp. Used by admins for bulk onboarding or when authentication setup is pending.';
ALTER TABLE profiles 
  DROP CONSTRAINT IF EXISTS profiles_id_fkey;
  'User profiles table. The id can be independent of auth.users to support manual employee creation. When authentication is configured, profiles should be linked to auth.users entries.';
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'profiles_id_fkey' 
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    RAISE EXCEPTION 'Failed to remove profiles_id_fkey constraint';
  END IF;
  RAISE NOTICE 'Foreign key constraint successfully removed. Manual employee creation is now enabled.';
END $$;
CREATE OR REPLACE FUNCTION create_manual_employee(
  p_full_name text,
  p_email text,
  p_role user_role,
  p_phone text DEFAULT NULL,
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id uuid;
  v_caller_role user_role;
  v_new_profile_id uuid;
  v_location_id uuid;
  v_result json;
BEGIN
  SELECT company_id, role INTO v_company_id, v_caller_role
  FROM profiles
  WHERE id = auth.uid();
  IF v_caller_role NOT IN ('admin', 'customer_responsible') THEN
    RAISE EXCEPTION 'Kun administratorer og kunde ansvarlige kan oprette medarbejdere manuelt';
  END IF;
  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Bruger har ingen tilknyttet virksomhed';
  END IF;
  IF EXISTS (SELECT 1 FROM profiles WHERE email = LOWER(p_email)) THEN
    RAISE EXCEPTION 'Email er allerede i brug';
  END IF;
  v_new_profile_id := gen_random_uuid();
  INSERT INTO profiles (
    id,
    email,
    full_name,
    phone,
    role,
    company_id,
    onboarding_completed,
  ) VALUES (
    v_new_profile_id,
    LOWER(p_email),
    p_full_name,
    p_phone,
    p_role,
    v_company_id,
    true
  );
  IF array_length(p_location_ids, 1) > 0 THEN
    LOOP
      IF NOT EXISTS (
        SELECT 1 FROM locations
        WHERE id = v_location_id AND company_id = v_company_id
      ) THEN
        RAISE EXCEPTION 'Lokation eksisterer ikke eller tilhører ikke virksomheden';
      END IF;
      INSERT INTO location_assignments (
        location_id,
        user_id,
      ) VALUES (
        v_location_id,
        v_new_profile_id
      );
    END LOOP;
  END IF;
  INSERT INTO company_audit_log (
    company_id,
    user_id,
    action,
    entity_type,
    entity_id,
  ) VALUES (
    v_company_id,
    auth.uid(),
    'create_manual_employee',
    'profile',
    v_new_profile_id,
      'employee_email', p_email,
      'employee_name', p_full_name,
      'role', p_role,
      'phone', p_phone,
      'location_count', COALESCE(array_length(p_location_ids, 1), 0),
    )
  );
  SELECT json_build_object(
    'id', p.id,
    'email', p.email,
    'full_name', p.full_name,
    'phone', p.phone,
    'role', p.role,
    'company_id', p.company_id,
    'created_at', p.created_at,
      SELECT COUNT(*)
      FROM location_assignments
      WHERE user_id = p.id
    )
  )
  FROM profiles p
  WHERE p.id = v_new_profile_id;
  RETURN v_result;
END;
$$;
GRANT EXECUTE ON FUNCTION create_manual_employee TO authenticated;
COMMENT ON FUNCTION create_manual_employee IS
  'Creates a new employee profile manually without requiring auth.signUp. Used by admins for bulk onboarding or when authentication setup is pending. Logs to audit table using correct column structure.';
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'favorite_entity_type') THEN
    CREATE TYPE favorite_entity_type AS ENUM ('customer', 'location');
  END IF;
END $$;
CREATE TABLE IF NOT EXISTS user_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  entity_type favorite_entity_type NOT NULL,
  entity_id uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own favorites"
  ON user_favorites
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can create own favorites"
  ON user_favorites
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own favorites"
  ON user_favorites
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_entity_type 
  ON user_favorites(user_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_entity_id 
  ON user_favorites(user_id, entity_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_entity_id 
  ON user_favorites(entity_id);
CREATE OR REPLACE FUNCTION toggle_favorite(
  p_entity_type favorite_entity_type,
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_exists boolean;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;
  SELECT EXISTS (
    SELECT 1 
    FROM user_favorites 
    WHERE user_id = v_user_id 
      AND entity_type = p_entity_type 
      AND entity_id = p_entity_id
  ) INTO v_exists;
  IF v_exists THEN
    DELETE FROM user_favorites
    WHERE user_id = v_user_id
      AND entity_type = p_entity_type
      AND entity_id = p_entity_id;
  ELSE
    INSERT INTO user_favorites (user_id, entity_type, entity_id)
    VALUES (v_user_id, p_entity_type, p_entity_id);
  END IF;
END;
$$;
GRANT EXECUTE ON FUNCTION toggle_favorite TO authenticated;
  'Stores user favorites for customers and locations. Each user can mark entities as favorites for quick access.';
COMMENT ON FUNCTION toggle_favorite IS
  'Toggles favorite status for a customer or location. Returns true if added, false if removed.';
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'locations' AND column_name = 'notes'
  ) THEN
    ALTER TABLE locations ADD COLUMN notes text;
  END IF;
END $$;
CREATE TABLE IF NOT EXISTS location_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  role text
);
ALTER TABLE location_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read location contacts in their company"
  ON location_contacts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM locations
      WHERE locations.id = location_contacts.location_id
        AND locations.company_id IN (
          SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    )
  );
CREATE POLICY "Users can create location contacts"
  ON location_contacts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM locations
      WHERE locations.id = location_contacts.location_id
        AND locations.company_id IN (
          SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    )
  );
CREATE POLICY "Users can update location contacts"
  ON location_contacts
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM locations
      WHERE locations.id = location_contacts.location_id
        AND locations.company_id IN (
          SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM locations
      WHERE locations.id = location_contacts.location_id
        AND locations.company_id IN (
          SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    )
  );
CREATE POLICY "Users can delete location contacts"
  ON location_contacts
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM locations
      WHERE locations.id = location_contacts.location_id
        AND locations.company_id IN (
          SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    )
  );
CREATE INDEX IF NOT EXISTS idx_location_contacts_location_id 
  ON location_contacts(location_id);
CREATE INDEX IF NOT EXISTS idx_location_contacts_email 
  ON location_contacts(email);
  'Stores contact persons for each location. Similar to customer_contacts but for locations.';
  'General notes about the location. Can include access instructions, special requirements, etc.';
CREATE TABLE IF NOT EXISTS requirement_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  display_order integer DEFAULT 0
);
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'location_requirements' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE location_requirements ADD COLUMN category_id uuid REFERENCES requirement_categories(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'location_requirements' AND column_name = 'display_order'
  ) THEN
    ALTER TABLE location_requirements ADD COLUMN display_order integer DEFAULT 0;
  END IF;
END $$;
ALTER TABLE requirement_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read requirement categories in their company"
  ON requirement_categories
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM locations
      WHERE locations.id = requirement_categories.location_id
        AND locations.company_id IN (
          SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    )
  );
CREATE POLICY "Users can create requirement categories"
  ON requirement_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM locations
      WHERE locations.id = requirement_categories.location_id
        AND locations.company_id IN (
          SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    )
  );
CREATE POLICY "Users can update requirement categories"
  ON requirement_categories
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM locations
      WHERE locations.id = requirement_categories.location_id
        AND locations.company_id IN (
          SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM locations
      WHERE locations.id = requirement_categories.location_id
        AND locations.company_id IN (
          SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    )
  );
CREATE POLICY "Users can delete requirement categories"
  ON requirement_categories
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM locations
      WHERE locations.id = requirement_categories.location_id
        AND locations.company_id IN (
          SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    )
  );
CREATE INDEX IF NOT EXISTS idx_requirement_categories_location_id 
  ON requirement_categories(location_id, display_order);
CREATE INDEX IF NOT EXISTS idx_location_requirements_category_id 
  ON location_requirements(category_id);
CREATE INDEX IF NOT EXISTS idx_location_requirements_display_order 
  ON location_requirements(location_id, display_order);
  'Categories for organizing location requirements. Examples: Safety Equipment, Access Requirements, etc.';
  'Optional category this requirement belongs to. NULL means uncategorized.';
  'Order of this requirement within its category or in the uncategorized list.';
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'location_images' AND column_name = 'is_pinned'
  ) THEN
    ALTER TABLE location_images ADD COLUMN is_pinned boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'location_images' AND column_name = 'pinned_at'
  ) THEN
    ALTER TABLE location_images ADD COLUMN pinned_at timestamptz;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'location_images' AND column_name = 'pinned_by'
  ) THEN
    ALTER TABLE location_images ADD COLUMN pinned_by uuid REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_location_images_pinned_order 
  ON location_images(location_id, is_pinned DESC, created_at DESC);
CREATE OR REPLACE FUNCTION toggle_image_pin(
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_is_pinned boolean;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;
  SELECT is_pinned INTO v_is_pinned
  FROM location_images
  WHERE id = p_image_id;
  IF v_is_pinned IS NULL THEN
    RAISE EXCEPTION 'Image not found';
  END IF;
  IF v_is_pinned THEN
    UPDATE location_images
    SET is_pinned = false,
        pinned_at = NULL,
    WHERE id = p_image_id;
  ELSE
    UPDATE location_images
    SET is_pinned = true,
        pinned_at = now(),
    WHERE id = p_image_id;
  END IF;
END;
$$;
GRANT EXECUTE ON FUNCTION toggle_image_pin TO authenticated;
  'Whether this image is marked as important and should appear first in the gallery.';
  'Timestamp when the image was pinned. NULL if not pinned.';
  'User who pinned this image. NULL if not pinned.';
COMMENT ON FUNCTION toggle_image_pin IS
  'Toggles pin status for an image. Returns true if pinned, false if unpinned.';
ALTER TABLE location_assignments
ADD COLUMN IF NOT EXISTS start_date date,
ADD COLUMN IF NOT EXISTS end_date date,
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true NOT NULL,
ADD COLUMN IF NOT EXISTS expired_at timestamptz;
UPDATE location_assignments
SET is_active = true
WHERE is_active IS NULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'location_assignments_date_check'
  ) THEN
    ALTER TABLE location_assignments
    CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_location_assignments_end_date
ON location_assignments(end_date)
WHERE end_date IS NOT NULL AND is_active = true;
CREATE INDEX IF NOT EXISTS idx_location_assignments_is_active
ON location_assignments(is_active);
CREATE INDEX IF NOT EXISTS idx_location_assignments_location_active
ON location_assignments(location_id, is_active);
CREATE OR REPLACE FUNCTION expire_location_assignments()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  expired_count integer := 0;
  assignment_record RECORD;
BEGIN
  FOR assignment_record IN
    SELECT 
      la.id,
      la.location_id,
      la.user_id,
    FROM location_assignments la
    WHERE la.end_date < CURRENT_DATE
      AND la.is_active = true
  LOOP
    UPDATE location_assignments
    SET is_active = false,
    WHERE id = assignment_record.id;
    INSERT INTO location_activity (location_id, actor_id, action_text)
    VALUES (
      assignment_record.location_id,
      assignment_record.user_id
    );
    expired_count := expired_count + 1;
  END LOOP;
  RETURN expired_count;
END;
$$;
CREATE OR REPLACE FUNCTION check_location_expiry(p_location_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  expired_count integer := 0;
  assignment_record RECORD;
BEGIN
  FOR assignment_record IN
    SELECT 
      la.id,
      la.location_id,
      la.user_id,
    FROM location_assignments la
    WHERE la.location_id = p_location_id
      AND la.end_date < CURRENT_DATE
      AND la.is_active = true
  LOOP
    UPDATE location_assignments
    SET is_active = false,
    WHERE id = assignment_record.id;
    INSERT INTO location_activity (location_id, actor_id, action_text)
    VALUES (
      assignment_record.location_id,
      assignment_record.user_id
    );
    expired_count := expired_count + 1;
  END LOOP;
  RETURN expired_count;
END;
$$;
DROP FUNCTION IF EXISTS create_manual_employee(text, text, user_role, text, uuid[]);
CREATE OR REPLACE FUNCTION create_manual_employee(
  p_full_name text,
  p_email text,
  p_role user_role,
  p_phone text DEFAULT NULL,
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id uuid;
  v_caller_role user_role;
  v_new_profile_id uuid;
  v_assignment jsonb;
  v_location_id uuid;
  v_start_date date;
  v_end_date date;
  v_is_permanent boolean;
  v_result json;
  v_assignment_count integer := 0;
BEGIN
  SELECT company_id, role INTO v_company_id, v_caller_role
  FROM profiles
  WHERE id = auth.uid();
  IF v_caller_role NOT IN ('admin', 'customer_responsible') THEN
    RAISE EXCEPTION 'Kun administratorer og kunde ansvarlige kan oprette medarbejdere manuelt';
  END IF;
  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Bruger har ingen tilknyttet virksomhed';
  END IF;
  IF EXISTS (SELECT 1 FROM profiles WHERE email = LOWER(p_email)) THEN
    RAISE EXCEPTION 'Email er allerede i brug';
  END IF;
  v_new_profile_id := gen_random_uuid();
  INSERT INTO profiles (
    id,
    email,
    full_name,
    phone,
    role,
    company_id,
    onboarding_completed,
  ) VALUES (
    v_new_profile_id,
    LOWER(p_email),
    p_full_name,
    p_phone,
    p_role,
    v_company_id
  );
  IF jsonb_array_length(p_location_assignments) > 0 THEN
    FOR v_assignment IN SELECT * FROM jsonb_array_elements(p_location_assignments)
    LOOP
      v_location_id := (v_assignment->>'location_id')::uuid;
      v_start_date := NULLIF(v_assignment->>'start_date', '')::date;
      v_end_date := NULLIF(v_assignment->>'end_date', '')::date;
      v_is_permanent := COALESCE((v_assignment->>'is_permanent')::boolean, true);
      IF v_is_permanent THEN
        v_end_date := NULL;
      END IF;
      IF v_start_date IS NOT NULL AND v_end_date IS NOT NULL AND v_end_date < v_start_date THEN
        RAISE EXCEPTION 'Slutdato skal være efter startdato for lokation %', v_location_id;
      END IF;
      IF NOT EXISTS (
        SELECT 1 FROM locations
        WHERE id = v_location_id AND company_id = v_company_id
      ) THEN
        RAISE EXCEPTION 'Lokation eksisterer ikke eller tilhører ikke virksomheden';
      END IF;
      INSERT INTO location_assignments (
        location_id,
        user_id,
        assigned_by,
        start_date,
        end_date,
      ) VALUES (
        v_location_id,
        v_new_profile_id,
        auth.uid(),
        v_start_date,
        v_end_date
      );
      v_assignment_count := v_assignment_count + 1;
    END LOOP;
  END IF;
  INSERT INTO company_audit_log (
    company_id,
    user_id,
    action,
  ) VALUES (
    v_company_id,
    auth.uid(),
    'create_manual_employee',
      'employee_id', v_new_profile_id,
      'employee_email', p_email,
      'employee_name', p_full_name,
      'role', p_role,
    )
  );
  SELECT json_build_object(
    'id', p.id,
    'email', p.email,
    'full_name', p.full_name,
    'phone', p.phone,
    'role', p.role,
    'company_id', p.company_id,
    'created_at', p.created_at,
      SELECT COUNT(*)
      FROM location_assignments
      WHERE user_id = p.id
    )
  )
  FROM profiles p
  WHERE p.id = v_new_profile_id;
  RETURN v_result;
END;
$$;
GRANT EXECUTE ON FUNCTION create_manual_employee TO authenticated;
COMMENT ON FUNCTION create_manual_employee IS
  'Creates a new employee profile manually with per-location timeframe support. Each location assignment can have its own start_date, end_date, and permanent flag.';
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'location_images' AND column_name = 'file_type'
  ) THEN
    ALTER TABLE location_images ADD COLUMN file_type text;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'location_images' AND column_name = 'file_size'
  ) THEN
    ALTER TABLE location_images ADD COLUMN file_size bigint;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'location_images' AND column_name = 'mime_type'
  ) THEN
    ALTER TABLE location_images ADD COLUMN mime_type text;
  END IF;
END $$;
CREATE TABLE IF NOT EXISTS customer_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz DEFAULT now()
);
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'folder_id'
  ) THEN
    ALTER TABLE customers ADD COLUMN folder_id uuid REFERENCES customer_folders(id) ON DELETE SET NULL;
  END IF;
END $$;
ALTER TABLE customer_folders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company members can view folders"
  ON customer_folders FOR SELECT
  TO authenticated
  USING (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );
CREATE POLICY "Company members can create folders"
  ON customer_folders FOR INSERT
  TO authenticated
  WITH CHECK (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );
CREATE POLICY "Company members can update folders"
  ON customer_folders FOR UPDATE
  TO authenticated
  USING (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );
CREATE POLICY "Company members can delete folders"
  ON customer_folders FOR DELETE
  TO authenticated
  USING (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );
CREATE INDEX IF NOT EXISTS idx_customer_folders_company_id ON customer_folders(company_id);
CREATE INDEX IF NOT EXISTS idx_customer_folders_name ON customer_folders(name);
CREATE INDEX IF NOT EXISTS idx_customers_folder_id ON customers(folder_id);
CREATE OR REPLACE FUNCTION update_customer_folders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS update_customer_folders_updated_at_trigger ON customer_folders;
CREATE TRIGGER update_customer_folders_updated_at_trigger
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_folders_updated_at();
CREATE TABLE IF NOT EXISTS location_folder_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  folder_name text NOT NULL,
  parent_folder_id uuid REFERENCES location_folder_templates(id) ON DELETE CASCADE,
  folder_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS location_file_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  folder_name text NOT NULL,
  parent_folder_id uuid REFERENCES location_file_folders(id) ON DELETE CASCADE,
  template_folder_id uuid REFERENCES location_folder_templates(id) ON DELETE CASCADE,
  folder_order integer DEFAULT 0,
  is_template_folder boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz DEFAULT now()
);
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'location_images' AND column_name = 'folder_id'
  ) THEN
    ALTER TABLE location_images ADD COLUMN folder_id uuid REFERENCES location_file_folders(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'location_images' AND column_name = 'file_name'
  ) THEN
    ALTER TABLE location_images ADD COLUMN file_name text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'location_images' AND column_name = 'description'
  ) THEN
    ALTER TABLE location_images ADD COLUMN description text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'location_images' AND column_name = 'is_pinned'
  ) THEN
    ALTER TABLE location_images ADD COLUMN is_pinned boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'location_images' AND column_name = 'pinned_at'
  ) THEN
    ALTER TABLE location_images ADD COLUMN pinned_at timestamptz;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'location_images' AND column_name = 'pinned_by'
  ) THEN
    ALTER TABLE location_images ADD COLUMN pinned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;
ALTER TABLE location_folder_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_file_folders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company members can view folder templates"
  ON location_folder_templates FOR SELECT
  TO authenticated
  USING (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );
CREATE POLICY "Company admins can create folder templates"
  ON location_folder_templates FOR INSERT
  TO authenticated
  WITH CHECK (
      SELECT company_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'customer_responsible')
    )
  );
CREATE POLICY "Company admins can update folder templates"
  ON location_folder_templates FOR UPDATE
  TO authenticated
  USING (
      SELECT company_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'customer_responsible')
    )
  )
  WITH CHECK (
      SELECT company_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'customer_responsible')
    )
  );
CREATE POLICY "Company admins can delete folder templates"
  ON location_folder_templates FOR DELETE
  TO authenticated
  USING (
      SELECT company_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'customer_responsible')
    )
  );
CREATE POLICY "Users can view folders for accessible locations"
  ON location_file_folders FOR SELECT
  TO authenticated
  USING (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );
CREATE POLICY "Users can create folders in accessible locations"
  ON location_file_folders FOR INSERT
  TO authenticated
  WITH CHECK (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );
CREATE POLICY "Users can update folders in accessible locations"
  ON location_file_folders FOR UPDATE
  TO authenticated
  USING (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    ) AND is_template_folder = false
  )
  WITH CHECK (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    ) AND is_template_folder = false
  );
CREATE POLICY "Users can delete user-created folders only"
  ON location_file_folders FOR DELETE
  TO authenticated
  USING (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    ) AND is_template_folder = false
  );
CREATE INDEX IF NOT EXISTS idx_location_folder_templates_company_id ON location_folder_templates(company_id);
CREATE INDEX IF NOT EXISTS idx_location_folder_templates_parent_id ON location_folder_templates(parent_folder_id);
CREATE INDEX IF NOT EXISTS idx_location_file_folders_location_id ON location_file_folders(location_id);
CREATE INDEX IF NOT EXISTS idx_location_file_folders_company_id ON location_file_folders(company_id);
CREATE INDEX IF NOT EXISTS idx_location_file_folders_parent_id ON location_file_folders(parent_folder_id);
CREATE INDEX IF NOT EXISTS idx_location_file_folders_template_id ON location_file_folders(template_folder_id);
CREATE INDEX IF NOT EXISTS idx_location_images_folder_id ON location_images(folder_id);
CREATE OR REPLACE FUNCTION get_folder_tree(p_location_id uuid)
RETURNS TABLE (
  id uuid,
  folder_name text,
  parent_folder_id uuid,
  folder_order integer,
  file_count bigint,
) AS $$
WITH RECURSIVE folder_tree AS (
  SELECT 
    lff.id,
    lff.folder_name,
    lff.parent_folder_id,
    lff.folder_order,
  FROM location_file_folders lff
  WHERE lff.location_id = p_location_id AND lff.parent_folder_id IS NULL
  UNION ALL
  SELECT 
    lff.id,
    lff.folder_name,
    lff.parent_folder_id,
    lff.folder_order,
  FROM location_file_folders lff
  WHERE lff.location_id = p_location_id
)
SELECT 
  ft.id,
  ft.folder_name,
  ft.parent_folder_id,
  ft.folder_order,
  COUNT(li.id) as file_count,
FROM folder_tree ft
ORDER BY ft.level, ft.folder_order, ft.folder_name;
$$ LANGUAGE sql STABLE;
CREATE OR REPLACE FUNCTION create_folder(
  p_company_id uuid,
  p_location_id uuid,
  p_folder_name text,
)
RETURNS uuid AS $$
DECLARE
  v_folder_id uuid;
  v_max_order integer;
BEGIN
  SELECT COALESCE(MAX(folder_order), -1) + 1
  FROM location_file_folders
  WHERE location_id = p_location_id AND parent_folder_id IS NOT DISTINCT FROM p_parent_folder_id;
  INSERT INTO location_file_folders (
    location_id,
    company_id,
    folder_name,
    parent_folder_id,
    folder_order,
    is_template_folder,
  ) VALUES (
    p_location_id,
    p_company_id,
    p_folder_name,
    p_parent_folder_id,
    v_max_order,
    false,
  )
  RETURNING id INTO v_folder_id;
  RETURN v_folder_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE OR REPLACE FUNCTION sync_folder_templates_to_location(
  p_company_id uuid,
)
RETURNS void AS $$
DECLARE
  v_template record;
  v_new_folder_id uuid;
  v_parent_mapping jsonb := '{}';
BEGIN
  DELETE FROM location_file_folders
  WHERE location_id = p_location_id AND is_template_folder = true;
  FOR v_template IN
    WITH RECURSIVE template_tree AS (
      SELECT 
        id,
        folder_name,
        parent_folder_id,
        folder_order,
      FROM location_folder_templates
      WHERE company_id = p_company_id AND parent_folder_id IS NULL
      UNION ALL
      SELECT 
        lft.id,
        lft.folder_name,
        lft.parent_folder_id,
        lft.folder_order,
      FROM location_folder_templates lft
      WHERE lft.company_id = p_company_id
    )
    SELECT * FROM template_tree ORDER BY level, folder_order, folder_name
  LOOP
    IF v_template.parent_folder_id IS NULL THEN
      v_new_folder_id := NULL;
    ELSE
      v_new_folder_id := (v_parent_mapping->>v_template.parent_folder_id::text)::uuid;
    END IF;
    INSERT INTO location_file_folders (
      location_id,
      company_id,
      folder_name,
      parent_folder_id,
      template_folder_id,
      folder_order,
      is_template_folder,
    ) VALUES (
      p_location_id,
      p_company_id,
      v_template.folder_name,
      v_new_folder_id,
      v_template.id,
      v_template.folder_order,
      true,
    )
    RETURNING id INTO v_new_folder_id;
      v_parent_mapping,
      ARRAY[v_template.id::text]
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE OR REPLACE FUNCTION sync_folder_templates_to_all_locations(
)
RETURNS void AS $$
DECLARE
  v_location record;
BEGIN
  FOR v_location IN
    SELECT id FROM locations WHERE company_id = p_company_id
  LOOP
    PERFORM sync_folder_templates_to_location(p_company_id, v_location.id);
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE OR REPLACE FUNCTION update_folder_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS update_location_folder_templates_updated_at_trigger ON location_folder_templates;
CREATE TRIGGER update_location_folder_templates_updated_at_trigger
  FOR EACH ROW
  EXECUTE FUNCTION update_folder_updated_at();
DROP TRIGGER IF EXISTS update_location_file_folders_updated_at_trigger ON location_file_folders;
CREATE TRIGGER update_location_file_folders_updated_at_trigger
  FOR EACH ROW
  EXECUTE FUNCTION update_folder_updated_at();
CREATE OR REPLACE FUNCTION auto_sync_templates_on_new_location()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM sync_folder_templates_to_location(NEW.company_id, NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS auto_sync_templates_on_new_location_trigger ON locations;
CREATE TRIGGER auto_sync_templates_on_new_location_trigger
  FOR EACH ROW
  EXECUTE FUNCTION auto_sync_templates_on_new_location();
CREATE OR REPLACE FUNCTION auto_sync_templates_on_template_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM sync_folder_templates_to_all_locations(OLD.company_id);
    RETURN OLD;
  ELSE
    PERFORM sync_folder_templates_to_all_locations(NEW.company_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS auto_sync_templates_on_template_change_trigger ON location_folder_templates;
CREATE TRIGGER auto_sync_templates_on_template_change_trigger
  AFTER INSERT OR UPDATE OR DELETE ON location_folder_templates
  FOR EACH ROW
  EXECUTE FUNCTION auto_sync_templates_on_template_change();
  table called "file_folders" instead of the correct "location_file_folders" table.
ALTER TABLE location_images 
DROP CONSTRAINT IF EXISTS location_images_folder_id_fkey;
ALTER TABLE location_images
ON DELETE SET NULL;
CREATE OR REPLACE FUNCTION sync_folder_templates_to_location(
  p_company_id uuid,
)
RETURNS void AS $$
DECLARE
  v_template record;
  v_new_folder_id uuid;
  v_parent_mapping jsonb := '{}';
BEGIN
  CREATE TEMP TABLE IF NOT EXISTS temp_file_template_mapping (
    file_id uuid,
  ) ON COMMIT DROP;
  INSERT INTO temp_file_template_mapping (file_id, template_folder_id)
  SELECT
    li.id as file_id,
  FROM location_images li
  WHERE li.location_id = p_location_id
    AND lff.is_template_folder = true
    AND lff.template_folder_id IS NOT NULL;
  DELETE FROM location_file_folders
  WHERE location_id = p_location_id AND is_template_folder = true;
  FOR v_template IN
    WITH RECURSIVE template_tree AS (
      SELECT
        id,
        folder_name,
        parent_folder_id,
        folder_order,
      FROM location_folder_templates
      WHERE company_id = p_company_id AND parent_folder_id IS NULL
      UNION ALL
      SELECT
        lft.id,
        lft.folder_name,
        lft.parent_folder_id,
        lft.folder_order,
      FROM location_folder_templates lft
      WHERE lft.company_id = p_company_id
    )
    SELECT * FROM template_tree ORDER BY level, folder_order, folder_name
  LOOP
    IF v_template.parent_folder_id IS NULL THEN
      v_new_folder_id := NULL;
    ELSE
      v_new_folder_id := (v_parent_mapping->>v_template.parent_folder_id::text)::uuid;
    END IF;
    INSERT INTO location_file_folders (
      location_id,
      company_id,
      folder_name,
      parent_folder_id,
      template_folder_id,
      folder_order,
      is_template_folder,
    ) VALUES (
      p_location_id,
      p_company_id,
      v_template.folder_name,
      v_new_folder_id,
      v_template.id,
      v_template.folder_order,
      true,
    )
    RETURNING id INTO v_new_folder_id;
      v_parent_mapping,
      ARRAY[v_template.id::text]
    );
  END LOOP;
  UPDATE location_images li
  SET folder_id = lff.id
  FROM temp_file_template_mapping tftm
    ON lff.template_folder_id = tftm.template_folder_id
    AND lff.location_id = p_location_id
    AND lff.is_template_folder = true
  WHERE li.id = tftm.file_id
    AND li.location_id = p_location_id;
  DROP TABLE IF EXISTS temp_file_template_mapping;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'azure_tenant_configs' AND column_name = 'admin_consent_granted'
  ) THEN
    ALTER TABLE azure_tenant_configs ADD COLUMN admin_consent_granted boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'azure_tenant_configs' AND column_name = 'admin_consent_granted_at'
  ) THEN
    ALTER TABLE azure_tenant_configs ADD COLUMN admin_consent_granted_at timestamptz;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'azure_tenant_configs' AND column_name = 'admin_consent_granted_by'
  ) THEN
    ALTER TABLE azure_tenant_configs ADD COLUMN admin_consent_granted_by text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'azure_tenant_configs' AND column_name = 'filter_by_groups'
  ) THEN
    ALTER TABLE azure_tenant_configs ADD COLUMN filter_by_groups boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'azure_tenant_configs' AND column_name = 'sync_groups'
  ) THEN
    ALTER TABLE azure_tenant_configs ADD COLUMN sync_groups jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_active boolean DEFAULT true;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'deactivated_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN deactivated_at timestamptz;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'deactivated_reason'
  ) THEN
    ALTER TABLE profiles ADD COLUMN deactivated_reason text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'azure_groups'
  ) THEN
    ALTER TABLE profiles ADD COLUMN azure_groups jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;
CREATE TABLE IF NOT EXISTS azure_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id uuid NOT NULL REFERENCES azure_tenant_configs(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  sync_started_at timestamptz DEFAULT now(),
  sync_completed_at timestamptz,
  sync_status text DEFAULT 'in_progress',
  users_found integer DEFAULT 0,
  users_created integer DEFAULT 0,
  users_updated integer DEFAULT 0,
  users_deactivated integer DEFAULT 0,
  users_reactivated integer DEFAULT 0,
  users_skipped integer DEFAULT 0,
  groups_synced jsonb DEFAULT '[]'::jsonb,
  errors jsonb DEFAULT '[]'::jsonb,
  error_message text,
  triggered_by uuid REFERENCES profiles(id),
  sync_duration_ms integer
);
CREATE INDEX IF NOT EXISTS idx_azure_sync_logs_config_id ON azure_sync_logs(config_id);
CREATE INDEX IF NOT EXISTS idx_azure_sync_logs_customer_id ON azure_sync_logs(customer_id);
CREATE INDEX IF NOT EXISTS idx_azure_sync_logs_sync_started_at ON azure_sync_logs(sync_started_at);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_azure_groups ON profiles USING gin(azure_groups);
ALTER TABLE azure_sync_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view sync logs"
  ON azure_sync_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.company_id = azure_sync_logs.company_id
      AND profiles.role = 'admin'
    )
  );
CREATE POLICY "System can insert sync logs"
  ON azure_sync_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
CREATE TABLE IF NOT EXISTS azure_group_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id uuid NOT NULL REFERENCES azure_tenant_configs(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  azure_group_id text NOT NULL,
  azure_group_name text,
  mapped_role user_role DEFAULT 'employee',
  is_active boolean DEFAULT true,
  auto_sync boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_azure_group_mappings_config_id ON azure_group_mappings(config_id);
ALTER TABLE azure_group_mappings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view group mappings"
  ON azure_group_mappings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.company_id = azure_group_mappings.company_id
      AND profiles.role = 'admin'
    )
  );
CREATE POLICY "Admins can insert group mappings"
  ON azure_group_mappings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.company_id = azure_group_mappings.company_id
      AND profiles.role = 'admin'
    )
  );
CREATE POLICY "Admins can update group mappings"
  ON azure_group_mappings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.company_id = azure_group_mappings.company_id
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.company_id = azure_group_mappings.company_id
      AND profiles.role = 'admin'
    )
  );
CREATE POLICY "Admins can delete group mappings"
  ON azure_group_mappings
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.company_id = azure_group_mappings.company_id
      AND profiles.role = 'admin'
    )
  );
CREATE OR REPLACE FUNCTION deactivate_user(
  user_id uuid,
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET 
    is_active = false,
    deactivated_at = now(),
  WHERE id = user_id;
  RETURN true;
END;
$$;
CREATE OR REPLACE FUNCTION reactivate_user(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET 
    is_active = true,
    deactivated_at = NULL,
  WHERE id = user_id;
  RETURN true;
END;
$$;
CREATE OR REPLACE FUNCTION log_azure_sync(
  p_config_id uuid,
  p_customer_id uuid,
  p_company_id uuid,
  p_status text,
  p_users_found integer DEFAULT 0,
  p_users_created integer DEFAULT 0,
  p_users_updated integer DEFAULT 0,
  p_users_deactivated integer DEFAULT 0,
  p_users_reactivated integer DEFAULT 0,
  p_errors jsonb DEFAULT '[]'::jsonb,
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  log_id uuid;
BEGIN
  INSERT INTO azure_sync_logs (
    config_id,
    customer_id,
    company_id,
    sync_status,
    users_found,
    users_created,
    users_updated,
    users_deactivated,
    users_reactivated,
    errors,
    error_message,
    triggered_by,
  ) VALUES (
    p_config_id,
    p_customer_id,
    p_company_id,
    p_status,
    p_users_found,
    p_users_created,
    p_users_updated,
    p_users_deactivated,
    p_users_reactivated,
    p_errors,
    p_error_message,
    auth.uid(),
  )
  RETURNING id INTO log_id;
  RETURN log_id;
END;
$$;
CREATE OR REPLACE FUNCTION get_user_azure_groups(user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  groups jsonb;
BEGIN
  SELECT azure_groups INTO groups
  FROM profiles
  WHERE id = user_id;
  RETURN COALESCE(groups, '[]'::jsonb);
END;
$$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'companies' AND column_name = 'azure_tenant_id'
  ) THEN
    ALTER TABLE companies ADD COLUMN azure_tenant_id text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'companies' AND column_name = 'azure_tenant_name'
  ) THEN
    ALTER TABLE companies ADD COLUMN azure_tenant_name text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'companies' AND column_name = 'azure_client_id'
  ) THEN
    ALTER TABLE companies ADD COLUMN azure_client_id text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'companies' AND column_name = 'azure_client_secret'
  ) THEN
    ALTER TABLE companies ADD COLUMN azure_client_secret text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'companies' AND column_name = 'azure_admin_consent_granted'
  ) THEN
    ALTER TABLE companies ADD COLUMN azure_admin_consent_granted boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'companies' AND column_name = 'azure_admin_consent_at'
  ) THEN
    ALTER TABLE companies ADD COLUMN azure_admin_consent_at timestamptz;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'companies' AND column_name = 'azure_sync_enabled'
  ) THEN
    ALTER TABLE companies ADD COLUMN azure_sync_enabled boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'companies' AND column_name = 'azure_sync_group_id'
  ) THEN
    ALTER TABLE companies ADD COLUMN azure_sync_group_id text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'companies' AND column_name = 'azure_sync_group_name'
  ) THEN
    ALTER TABLE companies ADD COLUMN azure_sync_group_name text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'companies' AND column_name = 'azure_auto_create_users'
  ) THEN
    ALTER TABLE companies ADD COLUMN azure_auto_create_users boolean DEFAULT true;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'companies' AND column_name = 'azure_last_sync_at'
  ) THEN
    ALTER TABLE companies ADD COLUMN azure_last_sync_at timestamptz;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'companies' AND column_name = 'azure_last_sync_status'
  ) THEN
    ALTER TABLE companies ADD COLUMN azure_last_sync_status text DEFAULT 'never';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'companies' AND column_name = 'azure_last_sync_error'
  ) THEN
    ALTER TABLE companies ADD COLUMN azure_last_sync_error text;
  END IF;
END $$;
CREATE TABLE IF NOT EXISTS company_azure_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  sync_started_at timestamptz DEFAULT now(),
  sync_completed_at timestamptz,
  sync_status text DEFAULT 'in_progress',
  users_found integer DEFAULT 0,
  users_created integer DEFAULT 0,
  users_updated integer DEFAULT 0,
  users_deactivated integer DEFAULT 0,
  users_reactivated integer DEFAULT 0,
  users_skipped integer DEFAULT 0,
  sync_group_id text,
  sync_group_name text,
  errors jsonb DEFAULT '[]'::jsonb,
  error_message text,
  triggered_by uuid REFERENCES profiles(id),
  trigger_type text DEFAULT 'manual',
  sync_duration_ms integer
);
CREATE INDEX IF NOT EXISTS idx_company_azure_sync_logs_company_id 
  ON company_azure_sync_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_company_azure_sync_logs_sync_started_at 
  ON company_azure_sync_logs(sync_started_at);
CREATE INDEX IF NOT EXISTS idx_company_azure_sync_logs_sync_status 
  ON company_azure_sync_logs(sync_status);
CREATE INDEX IF NOT EXISTS idx_companies_azure_tenant_id 
  ON companies(azure_tenant_id);
ALTER TABLE company_azure_sync_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view company sync logs"
  ON company_azure_sync_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.company_id = company_azure_sync_logs.company_id
      AND profiles.role = 'admin'
    )
  );
CREATE POLICY "System can insert company sync logs"
  ON company_azure_sync_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
CREATE OR REPLACE FUNCTION get_company_azure_config(p_company_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  config jsonb;
BEGIN
  SELECT jsonb_build_object(
    'company_id', id,
    'azure_tenant_id', azure_tenant_id,
    'azure_tenant_name', azure_tenant_name,
    'azure_client_id', azure_client_id,
    'azure_admin_consent_granted', azure_admin_consent_granted,
    'azure_admin_consent_at', azure_admin_consent_at,
    'azure_sync_enabled', azure_sync_enabled,
    'azure_sync_group_id', azure_sync_group_id,
    'azure_sync_group_name', azure_sync_group_name,
    'azure_auto_create_users', azure_auto_create_users,
    'azure_last_sync_at', azure_last_sync_at,
    'azure_last_sync_status', azure_last_sync_status,
  ) INTO config
  FROM companies
  WHERE id = p_company_id;
  RETURN config;
END;
$$;
CREATE OR REPLACE FUNCTION update_company_azure_config(
  p_company_id uuid,
  p_tenant_id text DEFAULT NULL,
  p_tenant_name text DEFAULT NULL,
  p_client_id text DEFAULT NULL,
  p_client_secret text DEFAULT NULL,
  p_sync_enabled boolean DEFAULT NULL,
  p_sync_group_id text DEFAULT NULL,
  p_sync_group_name text DEFAULT NULL,
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE companies
  SET 
    azure_tenant_id = COALESCE(p_tenant_id, azure_tenant_id),
    azure_tenant_name = COALESCE(p_tenant_name, azure_tenant_name),
    azure_client_id = COALESCE(p_client_id, azure_client_id),
    azure_client_secret = COALESCE(p_client_secret, azure_client_secret),
    azure_sync_enabled = COALESCE(p_sync_enabled, azure_sync_enabled),
    azure_sync_group_id = COALESCE(p_sync_group_id, azure_sync_group_id),
    azure_sync_group_name = COALESCE(p_sync_group_name, azure_sync_group_name),
  WHERE id = p_company_id;
  RETURN true;
END;
$$;
CREATE OR REPLACE FUNCTION record_azure_admin_consent(
  p_company_id uuid,
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE companies
  SET 
    azure_tenant_id = p_tenant_id,
    azure_admin_consent_granted = true,
  WHERE id = p_company_id;
  RETURN true;
END;
$$;
CREATE OR REPLACE FUNCTION log_company_azure_sync(
  p_company_id uuid,
  p_status text,
  p_users_found integer DEFAULT 0,
  p_users_created integer DEFAULT 0,
  p_users_updated integer DEFAULT 0,
  p_users_deactivated integer DEFAULT 0,
  p_users_reactivated integer DEFAULT 0,
  p_users_skipped integer DEFAULT 0,
  p_sync_group_id text DEFAULT NULL,
  p_sync_group_name text DEFAULT NULL,
  p_errors jsonb DEFAULT '[]'::jsonb,
  p_error_message text DEFAULT NULL,
  p_trigger_type text DEFAULT 'manual',
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  log_id uuid;
BEGIN
  INSERT INTO company_azure_sync_logs (
    company_id,
    sync_status,
    users_found,
    users_created,
    users_updated,
    users_deactivated,
    users_reactivated,
    users_skipped,
    sync_group_id,
    sync_group_name,
    errors,
    error_message,
    triggered_by,
    trigger_type,
    sync_duration_ms,
  ) VALUES (
    p_company_id,
    p_status,
    p_users_found,
    p_users_created,
    p_users_updated,
    p_users_deactivated,
    p_users_reactivated,
    p_users_skipped,
    p_sync_group_id,
    p_sync_group_name,
    p_errors,
    p_error_message,
    auth.uid(),
    p_trigger_type,
    p_sync_duration_ms,
  )
  RETURNING id INTO log_id;
  UPDATE companies
  SET 
    azure_last_sync_at = now(),
    azure_last_sync_status = p_status,
  WHERE id = p_company_id;
  RETURN log_id;
END;
$$;
CREATE TABLE IF NOT EXISTS azure_sync_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_principal_name text,
  display_name text,
  error_type text NOT NULL,
  error_message text NOT NULL,
  raw_data jsonb,
  sync_attempt_at timestamptz DEFAULT now(),
  resolved boolean DEFAULT false,
  resolved_at timestamptz
);
ALTER TABLE azure_sync_errors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company admins can view their sync errors"
  ON azure_sync_errors
  FOR SELECT
  TO authenticated
  USING (
      SELECT company_id 
      FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );
CREATE POLICY "Service role can insert sync errors"
  ON azure_sync_errors
  FOR INSERT
  TO service_role
  WITH CHECK (true);
CREATE POLICY "Company admins can update their sync errors"
  ON azure_sync_errors
  FOR UPDATE
  TO authenticated
  USING (
      SELECT company_id 
      FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  )
  WITH CHECK (
      SELECT company_id 
      FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );
CREATE INDEX IF NOT EXISTS idx_azure_sync_errors_company_id ON azure_sync_errors(company_id);
CREATE INDEX IF NOT EXISTS idx_azure_sync_errors_resolved ON azure_sync_errors(resolved);
CREATE INDEX IF NOT EXISTS idx_azure_sync_errors_sync_attempt_at ON azure_sync_errors(sync_attempt_at DESC);
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'job_title'
  ) THEN
    ALTER TABLE profiles ADD COLUMN job_title text;
  END IF;
END $$;