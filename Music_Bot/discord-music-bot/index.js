require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { DisTube } = require('distube');
const { YtDlpPlugin } = require('@distube/yt-dlp');
const fs = require('fs');
const path = require('path');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

client.commands = new Collection();

// Configurație DisTube simplă
client.distube = new DisTube(client, {
    plugins: [new YtDlpPlugin()]
});

// Event listeners pentru DisTube
client.distube
    .on('playSong', (queue, song) => {
        const embed = {
            color: 0x00ff00,
            title: '🎵 Redau acum',
            description: `**${song.name}**\nDurată: ${song.formattedDuration}\nCerut de: ${song.user}`,
            thumbnail: {
                url: song.thumbnail
            }
        };
        queue.textChannel.send({ embeds: [embed] });
    })
    .on('addSong', (queue, song) => {
        const embed = {
            color: 0xffff00,
            title: '➕ Adăugat în listă',
            description: `**${song.name}**\nDurată: ${song.formattedDuration}\nCerut de: ${song.user}`,
            thumbnail: {
                url: song.thumbnail
            }
        };
        queue.textChannel.send({ embeds: [embed] });
    })
    .on('error', (textChannel, error) => {
        console.error('DisTube Error:', error);
        if (textChannel && textChannel.send) {
            textChannel.send({
                embeds: [{
                    color: 0xff0000,
                    title: '❌ Eroare DisTube',
                    description: `A apărut o eroare: ${error.message.slice(0, 100)}...`
                }]
            });
        }
    });

// Load commands
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
            console.log(`✅ Loaded command: ${command.data.name}`);
        }
    }
}

// Event pentru când botul este gata
client.once('ready', () => {
    console.log(`✅ Botul este online ca ${client.user.tag}`);
    console.log(`🤖 Botul ${client.user.tag} este online!`);
    console.log(`🎵 DisTube este inițializat și gata de folosire!`);
});

// Event pentru interacțiuni slash commands - DIRECT în index.js, nu din events/
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`Nu s-a găsit comanda ${interaction.commandName}.`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error('Eroare la executarea comenzii:', error);
        
        const errorEmbed = {
            embeds: [{
                color: 0xff0000,
                title: '❌ Eroare',
                description: 'A apărut o eroare la executarea acestei comenzi!'
            }],
            flags: 64 // ephemeral flag
        };
        
        try {
            // Verifică dacă interacțiunea a fost deja răspunsă
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errorEmbed);
            } else {
                await interaction.reply(errorEmbed);
            }
        } catch (replyError) {
            console.error('Nu am putut trimite mesajul de eroare:', replyError);
        }
    }
});

client.login(process.env.TOKEN);