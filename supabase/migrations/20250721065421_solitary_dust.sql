/*
  # Tilføj lokationstildelinger for medarbejdere

  1. Ny tabel
    - `location_assignments`
      - `id` (uuid, primary key)
      - `location_id` (uuid, foreign key)
      - `user_id` (uuid, foreign key)
      - `assigned_by` (uuid, foreign key)
      - `created_at` (timestamp)

  2. Sikkerhed
    - Enable RLS på tabellen
    - Tilføj policies for rolle-baseret adgang
    - Opdater eksisterende policies for at respektere tildelinger

  3. Ændringer
    - Opdater RLS policies på locations og relaterede tabeller
    - Kun admins kan se alle lokationer
    - Medarbejdere kan kun se tildelte lokationer
*/

-- Opret location_assignments tabel
CREATE TABLE IF NOT EXISTS location_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(location_id, user_id)
);

-- Enable RLS
ALTER TABLE location_assignments ENABLE ROW LEVEL SECURITY;

-- Opret policies for location_assignments
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

-- Opdater locations policies for rolle-baseret adgang
DROP POLICY IF EXISTS "Allow authenticated users to read locations" ON locations;
DROP POLICY IF EXISTS "Allow authenticated users to manage locations" ON locations;

-- Ny policy: Admins kan se alle lokationer, medarbejdere kun tildelte
CREATE POLICY "Role-based location access"
  ON locations
  FOR SELECT
  TO authenticated
  USING (
    -- Admin kan se alt
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR
    -- Medarbejder kan kun se tildelte lokationer
    EXISTS (
      SELECT 1 FROM location_assignments
      WHERE location_id = locations.id AND user_id = auth.uid()
    )
  );

-- Admins kan administrere alle lokationer
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

-- Opdater location_requirements policies
DROP POLICY IF EXISTS "Allow authenticated users to read location_requirements" ON location_requirements;
DROP POLICY IF EXISTS "Allow authenticated users to manage location_requirements" ON location_requirements;

CREATE POLICY "Role-based location_requirements access"
  ON location_requirements
  FOR SELECT
  TO authenticated
  USING (
    -- Admin kan se alt
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR
    -- Medarbejder kan kun se requirements for tildelte lokationer
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
    -- Admin kan administrere alt
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR
    -- Medarbejder kan administrere requirements for tildelte lokationer
    EXISTS (
      SELECT 1 FROM location_assignments
      WHERE location_id = location_requirements.location_id AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    -- Admin kan administrere alt
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR
    -- Medarbejder kan administrere requirements for tildelte lokationer
    EXISTS (
      SELECT 1 FROM location_assignments
      WHERE location_id = location_requirements.location_id AND user_id = auth.uid()
    )
  );

-- Opdater location_images policies
DROP POLICY IF EXISTS "Allow authenticated users to read location_images" ON location_images;
DROP POLICY IF EXISTS "Allow authenticated users to manage location_images" ON location_images;

CREATE POLICY "Role-based location_images access"
  ON location_images
  FOR SELECT
  TO authenticated
  USING (
    -- Admin kan se alt
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR
    -- Medarbejder kan kun se billeder for tildelte lokationer
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
    -- Admin kan administrere alt
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR
    -- Medarbejder kan administrere billeder for tildelte lokationer
    EXISTS (
      SELECT 1 FROM location_assignments
      WHERE location_id = location_images.location_id AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    -- Admin kan administrere alt
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR
    -- Medarbejder kan administrere billeder for tildelte lokationer
    EXISTS (
      SELECT 1 FROM location_assignments
      WHERE location_id = location_images.location_id AND user_id = auth.uid()
    )
  );

-- Opdater location_activity policies
DROP POLICY IF EXISTS "Allow authenticated users to read location_activity" ON location_activity;
DROP POLICY IF EXISTS "Allow authenticated users to create location_activity" ON location_activity;

CREATE POLICY "Role-based location_activity access"
  ON location_activity
  FOR SELECT
  TO authenticated
  USING (
    -- Admin kan se alt
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR
    -- Medarbejder kan kun se aktivitet for tildelte lokationer
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
    auth.uid() = actor_id AND (
      -- Admin kan oprette aktivitet for alle lokationer
      EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
      )
      OR
      -- Medarbejder kan kun oprette aktivitet for tildelte lokationer
      EXISTS (
        SELECT 1 FROM location_assignments
        WHERE location_id = location_activity.location_id AND user_id = auth.uid()
      )
    )
  );

-- Opdater location_comments policies hvis de eksisterer
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
        -- Admin kan se alt
        EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid() AND role = 'admin'
        )
        OR
        -- Medarbejder kan kun se kommentarer for tildelte lokationer
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
        auth.uid() = user_id AND (
          -- Admin kan oprette kommentarer for alle lokationer
          EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
          )
          OR
          -- Medarbejder kan kun oprette kommentarer for tildelte lokationer
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

-- Opret indeks for bedre performance
CREATE INDEX IF NOT EXISTS idx_location_assignments_location_id ON location_assignments(location_id);
CREATE INDEX IF NOT EXISTS idx_location_assignments_user_id ON location_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_location_assignments_assigned_by ON location_assignments(assigned_by);