#!/usr/bin/env node

/**
 * Production Database Deployment Script
 *
 * This script reads all migration files and provides instructions
 * for applying them to the production database.
 */

import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Load production environment
config({ path: join(projectRoot, '.env.production') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const PROJECT_REF = SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

async function main() {
  console.log('='.repeat(70));
  console.log('Production Database Migration Instructions');
  console.log('='.repeat(70));
  console.log('');
  console.log(`Production Database: ${PROJECT_REF}`);
  console.log(`URL: ${SUPABASE_URL}`);
  console.log('');
  console.log('A consolidated migration file has been created:');
  console.log('  📄 production-migrations.sql (204 KB, 73 migrations)');
  console.log('');
  console.log('─'.repeat(70));
  console.log('OPTION 1: Apply via Supabase Dashboard (Recommended)');
  console.log('─'.repeat(70));
  console.log('');
  console.log('1. Go to: https://supabase.com/dashboard/project/' + PROJECT_REF + '/sql/new');
  console.log('');
  console.log('2. Copy the contents of production-migrations.sql');
  console.log('');
  console.log('3. Paste into the SQL Editor');
  console.log('');
  console.log('4. Click "Run" to execute all migrations');
  console.log('');
  console.log('─'.repeat(70));
  console.log('OPTION 2: Apply via Command Line');
  console.log('─'.repeat(70));
  console.log('');
  console.log('If you have database connection details:');
  console.log('');
  console.log('  psql "$DATABASE_URL" < production-migrations.sql');
  console.log('');
  console.log('Where DATABASE_URL is your Supabase PostgreSQL connection string.');
  console.log('You can find this in: Settings > Database > Connection string');
  console.log('');
  console.log('='.repeat(70));
  console.log('');

  // Show first few lines of the migration file
  console.log('Preview of migration file (first 30 lines):');
  console.log('─'.repeat(70));
  const content = await readFile(join(projectRoot, 'production-migrations.sql'), 'utf-8');
  const lines = content.split('\n');
  console.log(lines.slice(0, 30).join('\n'));
  console.log('...');
  console.log(`(${lines.length} total lines)`);
  console.log('');
}

main().catch(console.error);
