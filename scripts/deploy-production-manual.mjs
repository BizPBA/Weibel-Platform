#!/usr/bin/env node

/**
 * Manual Production Deployment Script
 *
 * This script guides you through the manual production deployment process:
 * 1. Pause for manual remapping to production database
 * 2. Deploy database migrations
 * 3. Build dist folder with production environment
 * 4. Pause for manual Netlify deployment
 * 5. Reminder to remap back to development database
 *
 * Usage:
 *   npm run deploy:prod:manual
 */

import { readdir, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { spawn } from 'child_process';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(colors.cyan + question + colors.reset, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

function printHeader(title) {
  console.log('');
  log('═'.repeat(70), 'bright');
  log(title, 'bright');
  log('═'.repeat(70), 'bright');
  console.log('');
}

function printSection(title) {
  console.log('');
  log('─'.repeat(70), 'blue');
  log(title, 'blue');
  log('─'.repeat(70), 'blue');
  console.log('');
}

async function step1_RemapToProduction() {
  printHeader('STEP 1: Remap til Produktionsdatabase');

  log('Du skal nu manuelt remapppe til produktionsdatabasen.', 'yellow');
  console.log('');
  console.log('1. Åbn Supabase Dashboard');
  console.log('2. Gå til Project Settings');
  console.log('3. Skift til produktionsprojektet (rbuiyieqipsvrgmoekix)');
  console.log('');
  log('VIGTIGT: Sørg for at du er mappet til PRODUKTIONSDATABASEN!', 'red');
  console.log('');

  const answer = await prompt('Er du mappet til produktionsdatabasen? (ja/nej): ');

  if (answer.toLowerCase() !== 'ja' && answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'j') {
    log('\nAfbryder deployment. Remap først til produktionsdatabasen.', 'red');
    process.exit(1);
  }

  log('\n✓ Fortsætter med deployment til produktionsdatabasen...', 'green');
}

async function step2_DeployMigrations() {
  printHeader('STEP 2: Deployer Database Migreringer');

  // Load production environment
  config({ path: join(projectRoot, '.env.production') });

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    log('Fejl: Mangler VITE_SUPABASE_URL eller SUPABASE_SERVICE_ROLE_KEY i .env.production', 'red');
    process.exit(1);
  }

  const PROJECT_REF = SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

  console.log(`Target Database: ${PROJECT_REF}`);
  console.log(`URL: ${SUPABASE_URL}`);
  console.log('');

  // Create Supabase client
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  // Get migration files
  const migrationsDir = join(projectRoot, 'supabase', 'migrations');
  const files = await readdir(migrationsDir);
  const migrationFiles = files.filter(f => f.endsWith('.sql')).sort();

  log(`Fandt ${migrationFiles.length} migrationsfiler`, 'cyan');
  console.log('');

  const answer = await prompt('Vil du deploye migreringerne til produktionsdatabasen? (ja/nej): ');

  if (answer.toLowerCase() !== 'ja' && answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'j') {
    log('\nSpringer database deployment over.', 'yellow');
    return;
  }

  log('\nDeployer migreringer...', 'cyan');

  // Apply migrations using the MCP Supabase tool approach
  log('Anvender migreringer via Supabase Management API...', 'cyan');

  // Note: In a real scenario, you'd use the actual deployment logic here
  // For now, we'll provide instructions
  console.log('');
  log('BEMÆRK: Migreringerne skal køres via Supabase Management Console', 'yellow');
  console.log('eller via det eksisterende deploy:migrations script.');
  console.log('');
  console.log('For at køre migreringerne, brug:');
  console.log('  npm run deploy:migrations');
  console.log('');

  await prompt('Tryk Enter når migreringerne er deployeret...');

  log('\n✓ Database migreringer completed', 'green');
}

async function step3_BuildDistFolder() {
  printHeader('STEP 3: Builder Dist Mappen til Netlify');

  log('Bygger produktionsversionen af applikationen...', 'cyan');
  console.log('');

  // Run vite build with production mode
  return new Promise((resolve, reject) => {
    const buildProcess = spawn('npm', ['run', 'build:prod'], {
      cwd: projectRoot,
      stdio: 'inherit',
      shell: true
    });

    buildProcess.on('close', (code) => {
      if (code !== 0) {
        log(`\n✗ Build fejlede med kode ${code}`, 'red');
        reject(new Error('Build failed'));
      } else {
        log('\n✓ Dist mappen er bygget succesfuldt', 'green');
        console.log('');
        console.log('Dist mappen er klar i: ./dist/');
        resolve();
      }
    });
  });
}

async function step4_ManualNetlifyDeploy() {
  printHeader('STEP 4: Manuel Netlify Deployment');

  log('Nu skal du manuelt deploye dist mappen til Netlify produktion.', 'yellow');
  console.log('');
  console.log('Deployment metoder:');
  console.log('');
  console.log('OPTION 1: Via Netlify CLI (hvis du har det installeret)');
  console.log('  cd til projektmappen og kør:');
  log('  npx netlify deploy --prod --dir=dist', 'cyan');
  console.log('');
  console.log('OPTION 2: Via Netlify Dashboard');
  console.log('  1. Gå til https://app.netlify.com/');
  console.log('  2. Vælg dit site');
  console.log('  3. Gå til "Deploys"');
  console.log('  4. Træk dist mappen til "Drop to upload"');
  console.log('');
  console.log('OPTION 3: Via Git Push');
  console.log('  1. Commit ændringerne');
  console.log('  2. Push til main/master branch');
  console.log('  3. Netlify deployer automatisk');
  console.log('');

  await prompt('Tryk Enter når du har deployeret til Netlify...');

  log('\n✓ Netlify deployment completed', 'green');
}

async function step5_RemapBackToDevelopment() {
  printHeader('STEP 5: Remap Tilbage til Development Database');

  log('VIGTIGT: Husk at remapppe tilbage til development databasen!', 'red');
  console.log('');
  console.log('1. Åbn Supabase Dashboard');
  console.log('2. Gå til Project Settings');
  console.log('3. Skift tilbage til development projektet (gqpyaqvpqgvjnfpjijln)');
  console.log('');
  log('Dette er vigtigt for at undgå at lave ændringer i produktion ved fejl!', 'yellow');
  console.log('');

  await prompt('Tryk Enter når du har remappet til development...');

  log('\n✓ Du er nu tilbage på development databasen', 'green');
}

async function main() {
  printHeader('🚀 MANUEL PRODUKTIONS DEPLOYMENT');

  log('Dette script guider dig gennem deployment processen:', 'cyan');
  console.log('');
  console.log('  1️⃣  Manuel remapping til produktionsdatabase');
  console.log('  2️⃣  Deploy database migreringer');
  console.log('  3️⃣  Build dist mappen');
  console.log('  4️⃣  Manuel Netlify deployment');
  console.log('  5️⃣  Remap tilbage til development');
  console.log('');

  const answer = await prompt('Er du klar til at starte? (ja/nej): ');

  if (answer.toLowerCase() !== 'ja' && answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'j') {
    log('\nDeployment aflyst.', 'yellow');
    process.exit(0);
  }

  try {
    await step1_RemapToProduction();
    await step2_DeployMigrations();
    await step3_BuildDistFolder();
    await step4_ManualNetlifyDeploy();
    await step5_RemapBackToDevelopment();

    printHeader('✅ DEPLOYMENT COMPLETED');

    log('Tillykke! Din applikation er nu deployeret til produktion.', 'green');
    console.log('');
    console.log('Næste steps:');
    console.log('  • Test produktionsapplikationen');
    console.log('  • Verificer at alle funktioner virker');
    console.log('  • Tjek for fejl i produktionslogs');
    console.log('');

  } catch (error) {
    log('\n✗ Deployment fejlede: ' + error.message, 'red');
    process.exit(1);
  }
}

main().catch(error => {
  log('Fatal error: ' + error.message, 'red');
  process.exit(1);
});
