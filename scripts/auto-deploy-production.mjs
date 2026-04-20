#!/usr/bin/env node

/**
 * Automated Production Database Deployment
 *
 * This script automatically applies all migrations to production by:
 * 1. Splitting migrations into manageable chunks
 * 2. Executing them via Supabase Management API
 */

import { readdir, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Load production environment
config({ path: join(projectRoot, '.env.production') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PROJECT_REF = SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Error: Missing environment variables');
  process.exit(1);
}

async function executeViaManagementAPI(sql) {
  // Try using Supabase Management API
  const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ query: sql })
  });

  if (response.ok) {
    return await response.json();
  }

  throw new Error(`HTTP ${response.status}: ${await response.text()}`);
}

async function executeViaPostgRESTRawEndpoint(sql) {
  // Try using PostgREST's raw SQL endpoint if available
  const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/sql',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Accept': 'application/json',
      'Prefer': 'tx=commit'
    },
    body: sql
  });

  if (response.ok) {
    return await response.json();
  }

  throw new Error(`HTTP ${response.status}: ${await response.text()}`);
}

async function getMigrationFiles() {
  const migrationsDir = join(projectRoot, 'supabase', 'migrations');
  const files = await readdir(migrationsDir);
  return files.filter(f => f.endsWith('.sql')).sort();
}

async function applyMigration(filename) {
  const migrationsDir = join(projectRoot, 'supabase', 'migrations');
  const filePath = join(migrationsDir, filename);
  const sql = await readFile(filePath, 'utf-8');

  console.log(`Applying: ${filename}`);

  // Try different methods
  const methods = [
    { name: 'Management API', fn: executeViaManagementAPI },
    { name: 'PostgREST Raw', fn: executeViaPostgRESTRawEndpoint },
  ];

  for (const method of methods) {
    try {
      await method.fn(sql);
      console.log(`✓ Applied via ${method.name}`);
      return true;
    } catch (error) {
      console.log(`  ${method.name} failed: ${error.message}`);
    }
  }

  console.log(`✗ All methods failed for ${filename}`);
  return false;
}

async function main() {
  console.log('='.repeat(70));
  console.log('Automated Production Deployment');
  console.log('='.repeat(70));
  console.log('');
  console.log(`Target: ${PROJECT_REF}`);
  console.log('');

  const files = await getMigrationFiles();
  console.log(`Found ${files.length} migrations`);
  console.log('');

  let success = 0;
  let failed = 0;

  for (const file of files) {
    const result = await applyMigration(file);
    if (result) {
      success++;
    } else {
      failed++;
    }
  }

  console.log('');
  console.log('='.repeat(70));
  console.log(`Summary: ${success} successful, ${failed} failed`);
  console.log('='.repeat(70));

  if (failed > 0) {
    console.log('');
    console.log('⚠️  Some migrations failed. Please use manual deployment:');
    console.log('');
    console.log('   node scripts/deploy-to-production.mjs');
    console.log('');
  }
}

main().catch(console.error);
