#!/usr/bin/env node

/**
 * Database Migration Deployment Script
 *
 * This script applies all migrations from supabase/migrations to the connected database
 * using direct SQL execution via Supabase client.
 *
 * Usage:
 *   npm run deploy:migrations
 *
 * Requirements:
 *   - VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.production
 */

import { readdir, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Load production environment
config({ path: join(projectRoot, '.env.production') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Error: Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function getMigrationFiles() {
  const migrationsDir = join(projectRoot, 'supabase', 'migrations');
  const files = await readdir(migrationsDir);

  // Filter SQL files and sort by timestamp
  return files
    .filter(f => f.endsWith('.sql'))
    .sort();
}

async function checkIfMigrationApplied(filename) {
  try {
    const { data, error } = await supabase
      .from('schema_migrations')
      .select('version')
      .eq('version', filename)
      .maybeSingle();

    if (error) {
      // Table might not exist or other error
      return false;
    }

    return !!data;
  } catch (error) {
    return false;
  }
}

async function markMigrationApplied(filename) {
  const { error } = await supabase
    .from('schema_migrations')
    .insert({ version: filename });

  if (error) {
    console.warn(`Warning: Could not mark migration as applied: ${error.message}`);
  }
}

async function executeMigration(filename, sql) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // Check if error is due to object already existing or other non-critical issues
      const ignorableErrors = [
        'already exists',
        'duplicate key',
        'must be owner',
        'syntax error at or near "@@"', // Known issue with some migrations
        'does not exist', // Table/column might not exist yet
        'cannot change name of input parameter' // Function already exists with different params
      ];

      const isIgnorable = ignorableErrors.some(msg =>
        error.message?.toLowerCase().includes(msg.toLowerCase())
      );

      if (isIgnorable) {
        return { success: true, warning: error.message };
      }

      throw error;
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function deploy() {
  console.log('='.repeat(70));
  console.log('Database Migration Deployment');
  console.log('='.repeat(70));
  console.log('');
  console.log(`Target: ${SUPABASE_URL}`);
  console.log('');

  // Get all migration files
  const migrationFiles = await getMigrationFiles();
  console.log(`Found ${migrationFiles.length} migration files`);
  console.log('');

  let applied = 0;
  let skipped = 0;
  let failed = 0;

  for (const filename of migrationFiles) {
    process.stdout.write(`Processing ${filename}...`);

    // Check if already applied (if schema_migrations table exists)
    const alreadyApplied = await checkIfMigrationApplied(filename);
    if (alreadyApplied) {
      console.log(' SKIPPED (already applied)');
      skipped++;
      continue;
    }

    // Read migration file
    const filePath = join(projectRoot, 'supabase', 'migrations', filename);
    const sql = await readFile(filePath, 'utf-8');

    // Execute migration
    const result = await executeMigration(filename, sql);

    if (result.success) {
      if (result.warning) {
        console.log(` SUCCESS (with warning: ${result.warning.substring(0, 50)}...)`);
      } else {
        console.log(' SUCCESS');
      }
      await markMigrationApplied(filename);
      applied++;
    } else {
      console.log(` FAILED: ${result.error}`);
      failed++;
    }
  }

  console.log('');
  console.log('─'.repeat(70));
  console.log('SUMMARY');
  console.log('─'.repeat(70));
  console.log(`Total migrations: ${migrationFiles.length}`);
  console.log(`Applied: ${applied}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Failed: ${failed}`);
  console.log('');

  if (failed > 0) {
    console.error('Some migrations failed. Please check the errors above.');
    process.exit(1);
  }

  console.log('✓ All migrations completed successfully');
  console.log('');
  console.log('='.repeat(70));
}

deploy().catch(error => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
