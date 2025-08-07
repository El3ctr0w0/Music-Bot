require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

// Load config.json for CLIENT_ID
let config = {};
let clientId = null;
let guildId = null;

try {
    const configPath = path.join(__dirname, 'config.json');
    if (fs.existsSync(configPath)) {
        config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        console.log('✅ Loaded config.json');
    }
} catch (error) {
    console.error('❌ Error loading config.json:', error.message);
}

// Validate configuration
console.log('🔍 Checking configuration...');

// Check TOKEN (from .env)
if (!process.env.TOKEN) {
    console.error('❌ TOKEN is missing from .env file!');
    console.error('Add: TOKEN=your_bot_token_here');
    process.exit(1);
}

// Check CLIENT_ID (from config.json or .env)
clientId = config.clientId || config.CLIENT_ID || process.env.CLIENT_ID;
if (!clientId) {
    console.error('❌ CLIENT_ID not found!');
    console.error('Add CLIENT_ID to either:');
    console.error('• config.json: {"clientId": "your_bot_application_id"}');
    console.error('• .env file: CLIENT_ID=your_bot_application_id');
    console.error('\n💡 How to get CLIENT_ID:');
    console.error('1. Go to https://discord.com/developers/applications');
    console.error('2. Select your bot');
    console.error('3. Copy the Application ID from General Information tab');
    process.exit(1);
}

// Check GUILD_ID (optional - from config.json or .env)
guildId = config.guildId || config.GUILD_ID || process.env.GUILD_ID;

console.log(`✅ TOKEN: ${process.env.TOKEN.substring(0, 20)}...`);
console.log(`✅ CLIENT_ID: ${clientId}`);

if (guildId) {
    console.log(`✅ GUILD_ID: ${guildId} (Guild-specific deployment)`);
} else {
    console.log(`⚠️  GUILD_ID not set (Global deployment - slower)`);
}

const commands = [];

// Încarcă toate comenzile din directorul commands
const foldersPath = path.join(__dirname, 'commands');
if (fs.existsSync(foldersPath)) {
    const commandFiles = fs.readdirSync(foldersPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(foldersPath, file);
        const command = require(filePath);
        
        if ('data' in command && 'execute' in command) {
            commands.push(command.data.toJSON());
            console.log(`✅ Loaded command: ${command.data.name}`);
        } else {
            console.log(`❌ Command missing 'data' or 'execute' property: ${file}`);
        }
    }
} else {
    console.error('❌ Commands folder not found!');
    process.exit(1);
}

// Construiește și pregătește instanța REST
const rest = new REST().setToken(process.env.TOKEN);

// Înregistrează comenzile
(async () => {
    try {
        console.log(`\n🔄 Started refreshing ${commands.length} application (/) commands.`);

        // Pentru guild commands (mai rapid pentru development):
        if (guildId) {
            console.log(`📍 Registering commands for guild: ${guildId}`);
            
            const data = await rest.put(
                Routes.applicationGuildCommands(clientId, guildId),
                { body: commands },
            );

            console.log(`✅ Successfully reloaded ${data.length} guild application (/) commands.`);
        } else {
            // Pentru global commands (mai lent, dar pentru toate serverele):
            console.log('🌍 Registering global commands...');
            
            const data = await rest.put(
                Routes.applicationCommands(clientId),
                { body: commands },
            );

            console.log(`✅ Successfully reloaded ${data.length} global application (/) commands.`);
        }

        console.log('\n📋 Registered commands:');
        commands.forEach((cmd, index) => {
            console.log(`${index + 1}. /${cmd.name} - ${cmd.description}`);
            if (cmd.options && cmd.options.length > 0) {
                cmd.options.forEach(option => {
                    console.log(`   └── ${option.name} (${option.type === 3 ? 'string' : 'other'}) - ${option.description} ${option.required ? '[REQUIRED]' : '[OPTIONAL]'}`);
                });
            }
        });

        console.log('\n🎉 Command registration complete!');
        console.log('💡 Commands should be available immediately in your Discord server.');
        
    } catch (error) {
        console.error('❌ Error registering commands:', error);
        
        if (error.code === 50001) {
            console.error('\n🚨 Missing Access Error:');
            console.error('• Check if BOT_TOKEN is correct');
            console.error('• Check if CLIENT_ID is correct');
            console.error('• Make sure bot is in the server (if using GUILD_ID)');
        } else if (error.code === 'TOKEN_INVALID') {
            console.error('\n🚨 Invalid Token Error:');
            console.error('• Check your .env file');
            console.error('• Verify TOKEN is correct from Discord Developer Portal');
        }
        
        process.exit(1);
    }
})();