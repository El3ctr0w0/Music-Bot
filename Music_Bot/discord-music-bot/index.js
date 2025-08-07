require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { DisTube } = require('distube');
const { YouTubePlugin } = require('@distube/youtube');
const { SoundCloudPlugin } = require('@distube/soundcloud');
const { SpotifyPlugin } = require('@distube/spotify');
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

// Configurație DisTube minimă
client.distube = new DisTube(client, {
    plugins: [
        new YouTubePlugin(),
        new SoundCloudPlugin(),
        new SpotifyPlugin()
    ]
});

// Event listeners pentru DisTube - DOAR UNA SINGURĂ DATĂ
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
    .on('addList', (queue, playlist) => {
        const embed = {
            color: 0x00ffff,
            title: '📋 Playlist adăugat',
            description: `**${playlist.name}**\n${playlist.songs.length} melodii\nCerut de: ${playlist.user}`,
            thumbnail: {
                url: playlist.thumbnail
            }
        };
        queue.textChannel.send({ embeds: [embed] });
    })
    .on('searchResult', (message, result) => {
        let i = 0;
        const embed = {
            color: 0x0099ff,
            title: '🔍 Rezultate căutare',
            description: `${result.map(song => `**${++i}**. ${song.name} - \`${song.formattedDuration}\``).join('\n')}`,
            footer: {
                text: 'Scrie numărul melodiei dorite (1-10) sau "cancel" pentru anulare'
            }
        };
        message.channel.send({ embeds: [embed] });
    })
    .on('searchCancel', (message) => {
        const embed = {
            color: 0xffa500,
            title: '🚫 Căutare anulată',
            description: 'Nu ai selectat nicio melodie.'
        };
        message.channel.send({ embeds: [embed] });
    })
    .on('searchNoResult', (message, query) => {
        const embed = {
            color: 0xff0000,
            title: '❌ Niciun rezultat',
            description: `Nu am găsit nimic pentru: **${query}**`
        };
        message.channel.send({ embeds: [embed] });
    })
    .on('finish', (queue) => {
        const embed = {
            color: 0x808080,
            title: '✅ Playlist terminat',
            description: 'Am terminat de redat toate melodiile!'
        };
        queue.textChannel.send({ embeds: [embed] });
    })
    .on('disconnect', (queue) => {
        const embed = {
            color: 0xff6600,
            title: '👋 Deconectat',
            description: 'M-am deconectat de la voice channel!'
        };
        queue.textChannel.send({ embeds: [embed] });
    })
    .on('empty', (queue) => {
        const embed = {
            color: 0xffa500,
            title: '😴 Voice channel gol',
            description: 'Voice channel-ul este gol. Mă deconectez!'
        };
        queue.textChannel.send({ embeds: [embed] });
    })
    .on('initQueue', (queue) => {
        queue.autoplay = false;
        queue.volume = 50;
    })
    .on('noRelated', (queue) => {
        const embed = {
            color: 0xffa500,
            title: '❌ Nu am găsit melodii similare',
            description: 'Nu am putut găsi melodii similare pentru autoplay!'
        };
        queue.textChannel.send({ embeds: [embed] });
    })
    .on('error', (textChannel, error) => {
        console.error('DisTube Error:', error);
        
        let errorMessage = 'A apărut o eroare necunoscută!';
        let errorTitle = '❌ Eroare DisTube';
        
        // Identifică tipul de eroare și oferă soluții specifice
        if (error.message.includes('fragment') || error.message.includes('403') || error.message.includes('Forbidden')) {
            console.log('Fragment/403 error detected, continuing...');
            return;
        } else if (error.errorCode === 'NOT_SUPPORTED_URL') {
            errorMessage = '❌ **URL nesuportat!**\n\n**Încearcă:**\n• Un link YouTube direct\n• Caută după numele melodiei\n• Verifică dacă link-ul este valid';
            errorTitle = '🔗 URL nesuportat';
        } else if (error.message.includes('not valid JSON') || error.message.includes('ERROR:')) {
            errorMessage = '❌ **Eroare de procesare!**\n\n**Soluții:**\n• Încearcă din nou\n• Sau încearcă un alt video/link';
            errorTitle = '🔧 Problemă de procesare';
        } else if (error.message.includes('FFMPEG_NOT_INSTALLED') || error.message.includes('ffmpeg')) {
            errorMessage = '❌ **FFmpeg nu este instalat!**\n\n**Soluție:**\n• Windows: `winget install ffmpeg`\n• Apoi restartează aplicația';
            errorTitle = '🛠️ FFmpeg lipsește';
        } else if (error.message.includes('No result found') || error.message.includes('not found')) {
            errorMessage = '❌ **Nu am găsit rezultate!**\n\nÎncearcă:\n• Un link YouTube direct\n• Un nume de melodie mai specific';
            errorTitle = '🔍 Fără rezultate';
        } else if (error.message.includes('Age restricted') || error.message.includes('age-restricted')) {
            errorMessage = '❌ **Videoclipul are restricție de vârstă!**\n\nÎncearcă un alt video.';
            errorTitle = '🔞 Restricție vârstă';
        } else if (error.message.includes('Private video') || error.message.includes('private')) {
            errorMessage = '❌ **Videoclipul este privat!**\n\nÎncearcă un video public.';
            errorTitle = '🔒 Video privat';
        } else if (error.message.includes('Video unavailable') || error.message.includes('unavailable')) {
            errorMessage = '❌ **Videoclipul nu este disponibil!**\n\nPoate fi:\n• Șters de pe YouTube\n• Blocat în regiunea ta\n• Link invalid';
            errorTitle = '📹 Video indisponibil';
        } else if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
            errorMessage = '❌ **Timeout!**\n\nConexiunea a fost prea lentă.\nÎncearcă din nou.';
            errorTitle = '⏱️ Timeout';
        } else if (error.message.includes('rate limit') || error.message.includes('429')) {
            errorMessage = '❌ **Rate limit atins!**\n\nPrea multe cereri. Așteaptă câteva minute.';
            errorTitle = '🚦 Rate limit';
        }
        
        if (textChannel && textChannel.send) {
            textChannel.send({
                embeds: [{
                    color: 0xff0000,
                    title: errorTitle,
                    description: errorMessage,
                    footer: {
                        text: 'Dacă problema persistă, verifică dacă toate dependențele sunt actualizate.'
                    },
                    timestamp: new Date()
                }]
            }).catch(err => {
                console.error('Nu am putut trimite mesajul de eroare:', err);
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

// Event pentru interacțiuni slash commands
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
            ephemeral: true
        };
        
        try {
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