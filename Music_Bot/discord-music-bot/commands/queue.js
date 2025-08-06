const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Afișează lista de melodii'),

  async execute(interaction) {
    const queue = interaction.client.distube.getQueue(interaction);
    if (!queue) {
      return interaction.reply({
        embeds: [{
          color: 0xff0000,
          title: '❌ Eroare',
          description: 'Nu se redă nicio muzică!'
        }],
        ephemeral: true
      });
    }

    const songs = queue.songs.map((song, index) => {
      if (index === 0) {
        return `**🎵 Acum: ${song.name}** - ${song.formattedDuration}`;
      }
      return `**${index}.** ${song.name} - ${song.formattedDuration}`;
    }).slice(0, 10);

    await interaction.reply({
      embeds: [{
        color: 0x0099ff,
        title: '📝 Lista de melodii',
        description: songs.join('\n') + (queue.songs.length > 10 ? `\n\n*...și încă ${queue.songs.length - 10} melodii*` : ''),
        footer: {
          text: `Total: ${queue.songs.length} melodii`
        }
      }]
    });
  }
};