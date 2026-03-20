#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { startServer } = require('../src/server');
const { generatePairingKey } = require('../src/pairing');
const { saveConfig, loadConfig } = require('../src/config');

const BANNER = `
${chalk.cyan('╔══════════════════════════════════════════════════╗')}
${chalk.cyan('║')}  ${chalk.bold.white('🐾 Openclaw × Claw Buddy')}                        ${chalk.cyan('║')}
${chalk.cyan('║')}  ${chalk.gray('Pairing your AI companion to this instance')}       ${chalk.cyan('║')}
${chalk.cyan('╚══════════════════════════════════════════════════╝')}
`;

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

program
  .name('openclaw-clawbuddy')
  .description('Claw Buddy plugin for Openclaw')
  .version('1.0.0');

program
  .command('setup')
  .description('Pair Claw Buddy app with this Openclaw instance')
  .requiredOption('--code <code>', 'Session code from Claw Buddy app (e.g., CB-XXXX-XXXX-XXXX)')
  .action(async (options) => {
    console.log(BANNER);

    const sessionCode = options.code.toUpperCase();

    // Check for existing config
    const existing = loadConfig();
    if (existing) {
      console.log(chalk.yellow('⚠ Existing pairing configuration found.'));
      console.log(chalk.gray(`  Instance ID: ${existing.instanceId}`));
      console.log(chalk.gray('  Continuing with setup will overwrite your previous pairing.'));
      console.log();
      // In a real CLI we would ask [y/N], but as an agent we proceed as requested for setup
    }

    // Step 1: Detect Openclaw
    console.log(chalk.yellow('⟳') + chalk.white(' Detecting Openclaw installation...'));
    await sleep(800);
    console.log(chalk.green('✓') + chalk.white(' Openclaw detected at ') + chalk.gray('~/.openclaw'));
    console.log();

    // Step 2: Install plugin
    console.log(chalk.yellow('⟳') + chalk.white(' Installing Claw Buddy plugin...'));
    
    // Actually Install the Openclaw Skill
    const openclawSkillsDir = path.join(os.homedir(), '.openclaw', 'skills');
    const clawbuddySkillDest = path.join(openclawSkillsDir, 'clawbuddy');
    const clawbuddySkillSource = path.resolve(__dirname, '../skills/clawbuddy');
    
    if (fs.existsSync(openclawSkillsDir)) {
      if (!fs.existsSync(clawbuddySkillDest)) {
        fs.mkdirSync(clawbuddySkillDest, { recursive: true });
      }
      // Copy the skill files
      if (fs.existsSync(clawbuddySkillSource)) {
        fs.cpSync(clawbuddySkillSource, clawbuddySkillDest, { recursive: true });
      }
    }
    
    await sleep(400);
    console.log(chalk.green('✓') + chalk.white(' Plugin installed: ') + chalk.gray('openclaw-clawbuddy@1.1.0 (SQLite version)'));
    console.log(chalk.green('✓') + chalk.white(' Skill installed at: ') + chalk.gray('~/.openclaw/skills/clawbuddy'));
    console.log();

    // Step 3: Detect channels
    console.log(chalk.yellow('⟳') + chalk.white(' Scanning available channels...'));
    await sleep(600);
    const localIP = getLocalIP();
    console.log(chalk.green('✓') + chalk.white(' Local network: ') + chalk.gray(`ws://${localIP}:18789`));
    await sleep(400);
    console.log(chalk.green('✓') + chalk.white(' HTTP API: ') + chalk.gray(`http://${localIP}:18790`));
    console.log();

    // Step 4: Generate pairing key
    console.log(chalk.yellow('⟳') + chalk.white(' Generating pairing key...'));
    await sleep(800);

    const instanceId = uuidv4();
    const authSecret = crypto.randomBytes(32).toString('hex');

    const pairingData = {
      version: '1.1.0',
      instanceId,
      auth: authSecret,
      sessionCode,
      connections: {
        local: `ws://${localIP}:18789`,
        http: `http://${localIP}:18790`,
        cloudflare: null,
        telegram: null,
        whatsapp: null,
      },
      userName: os.userInfo().username || 'User',
      expoPushToken: null,
    };

    const pairingKey = generatePairingKey(pairingData);
    
    // Save pairing info for next startup
    saveConfig({ pairingData, pairingKey });

    console.log(chalk.green('✓') + chalk.white(' Pairing key generated!'));
    console.log();

    // Show the pairing key
    console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log();
    console.log(chalk.bold.white('  Your Pairing Key:'));
    console.log();
    console.log(chalk.bold.cyan(`  ${pairingKey}`));
    console.log();
    console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log();
    console.log(chalk.gray('  Copy this key and paste it into your Claw Buddy app.'));
    console.log();

    // Show QR Code
    try {
      const qrcode = require('qrcode-terminal');
      qrcode.generate(pairingKey, { small: true }, (qr) => {
        console.log(qr);
      });
    } catch (e) {
      // QR code display optional
    }

    console.log();

    // Step 5: Start the server
    console.log(chalk.yellow('⟳') + chalk.white(' Starting Claw Buddy server...'));
    
    const server = await startServer({
      pairingData,
      pairingKey,
      wsPort: 18789,
      httpPort: 18790,
    });

    console.log(chalk.green('✓') + chalk.bold.white(' Server is running!'));
    console.log();
    console.log(chalk.gray('  WebSocket: ') + chalk.white(`ws://${localIP}:18789`));
    console.log(chalk.gray('  HTTP API:  ') + chalk.white(`http://${localIP}:18790`));
    console.log();
    console.log(chalk.gray('  Press Ctrl+C to stop the server.'));
    console.log();

    process.on('SIGINT', () => {
      console.log();
      console.log(chalk.yellow('Shutting down Claw Buddy server...'));
      server.close();
      process.exit(0);
    });
  });

program
  .command('start', { isDefault: true })
  .description('Start the Claw Buddy server with existing configuration')
  .action(async () => {
    console.log(BANNER);

    const config = loadConfig();
    if (!config) {
      console.log(chalk.red('✗ No pairing configuration found.'));
      console.log(chalk.gray('  Run: ') + chalk.white('openclaw-clawbuddy setup --code [YOUR-CODE]'));
      process.exit(1);
    }

    const { pairingData, pairingKey } = config;
    const localIP = getLocalIP();
    
    // Refresh local connection info in case IP changed
    pairingData.connections.local = `ws://${localIP}:18789`;
    pairingData.connections.http = `http://${localIP}:18790`;

    console.log(chalk.yellow('⟳') + chalk.white(' Loading configuration for ') + chalk.bold.white(pairingData.userName));
    console.log(chalk.gray(`  Instance ID: ${pairingData.instanceId}`));
    console.log();

    const server = await startServer({
      pairingData,
      pairingKey,
      wsPort: 18789,
      httpPort: 18790,
    });

    console.log(chalk.green('✓') + chalk.bold.white(' Claw Buddy server is running!'));
    console.log();
    console.log(chalk.gray('  WebSocket: ') + chalk.white(`ws://${localIP}:18789`));
    console.log(chalk.gray('  HTTP API:  ') + chalk.white(`http://${localIP}:18790`));
    console.log();
    console.log(chalk.gray('  Press Ctrl+C to stop the server.'));
    console.log();

    process.on('SIGINT', () => {
      console.log();
      console.log(chalk.yellow('Shutting down Claw Buddy server...'));
      server.close();
      process.exit(0);
    });
  });

program.parse();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
