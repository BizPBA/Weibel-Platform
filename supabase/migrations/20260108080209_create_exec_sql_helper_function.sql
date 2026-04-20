/*
  # Create exec_sql Helper Function

  Creates a helper function for the migration deployment script to execute SQL.
  This function is SECURITY DEFINER to allow migrations to run with elevated privileges.
  
  IMPORTANT: This function should only be called by trusted deployment scripts.
*/

CREATE OR REPLACE FUNCTION exec_sql(query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  EXECUTE query;
  RETURN '{"success": true}'::json;
EXCEPTION WHEN OTHERS THEN
  RAISE;
END;
$$;

-- Grant execute permission to authenticated users (service role)
GRANT EXECUTE ON FUNCTION exec_sql(text) TO authenticated, service_role;
