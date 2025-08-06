const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Pune muzică de pe YouTube într-un voice channel')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('Link YouTube sau nume melodie')
                .setRequired(true)
        ),

    async execute(interaction) {
        const query = interaction.options.getString('query');
        
        // Verifică dacă utilizatorul este într-un voice channel
        if (!interaction.member.voice.channel) {
            return interaction.reply({ 
                embeds: [{
                    color: 0xff0000,
                    title: '❌ Eroare',
                    description: 'Trebuie să fii într-un voice channel!'
                }], 
                flags: 64 // ephemeral flag
            });
        }

        // Verifică dacă botul are permisiunile necesare
        const permissions = interaction.member.voice.channel.permissionsFor(interaction.client.user);
        if (!permissions.has('Connect') || !permissions.has('Speak')) {
            return interaction.reply({ 
                embeds: [{
                    color: 0xff0000,
                    title: '❌ Eroare',
                    description: 'Nu am permisiunile necesare pentru a mă conecta la voice channel!'
                }], 
                flags: 64 // ephemeral flag
            });
        }

        // Reply imediat cu loading message
        await interaction.reply({
            embeds: [{
                color: 0xffff00,
                title: '🔄 Se încarcă...',
                description: `Caut: **${query}**`
            }]
        });

        try {
            // Folosește DisTube-ul din client
            const distube = interaction.client.distube;

            // Redă muzica
            await distube.play(interaction.member.voice.channel, query, {
                member: interaction.member,
                textChannel: interaction.channel
            });

            // Șterge mesajul de loading după 2 secunde
            setTimeout(async () => {
                try {
                    await interaction.deleteReply();
                } catch (error) {
                    // Ignore error if message was already deleted
                }
            }, 2000);

        } catch (error) {
            console.error('Play command error:', error);
            
            let errorMessage = 'A apărut o eroare necunoscută!';
            
            if (error.message.includes('FFMPEG_NOT_INSTALLED')) {
                errorMessage = '❌ **FFmpeg nu este instalat!**\n\nInstalează FFmpeg:\n• Windows: `winget install ffmpeg`\n• Apoi restartează PowerShell';
            } else if (error.message.includes('No result found')) {
                errorMessage = 'Nu am găsit niciun rezultat pentru această căutare!';
            } else if (error.message.includes('Age restricted')) {
                errorMessage = 'Videoclipul are restricție de vârstă!';
            } else if (error.message.includes('Private video')) {
                errorMessage = 'Videoclipul este privat!';
            } else if (error.message.includes('Video unavailable')) {
                errorMessage = 'Videoclipul nu este disponibil!';
            }

            try {
                await interaction.editReply({
                    embeds: [{
                        color: 0xff0000,
                        title: '❌ Eroare',
                        description: errorMessage
                    }]
                });
            } catch (editError) {
                console.error('Nu am putut edita reply-ul:', editError);
            }
        }
    }
};