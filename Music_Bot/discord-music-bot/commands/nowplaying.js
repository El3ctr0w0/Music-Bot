const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('Afișează melodia care se redă acum'),

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

    const song = queue.songs[0];
    const progressBar = createProgressBar(queue.currentTime, song.duration);

    await interaction.reply({
      embeds: [{
        color: 0x0099ff,
        title: '🎵 Se redă acum',
        description: `**${song.name}**\n${progressBar}\n\`${queue.formattedCurrentTime} / ${song.formattedDuration}\``,
        thumbnail: {
          url: song.thumbnail
        },
        fields: [
          {
            name: 'Cerut de',
            value: song.user.tag,
            inline: true
          },
          {
            name: 'Volum',
            value: `${queue.volume}%`,
            inline: true
          },
          {
            name: 'În listă',
            value: `${queue.songs.length} melodii`,
            inline: true
          }
        ]
      }]
    });
  }
};

function createProgressBar(current, total) {
  const percentage = current / total;
  const progress = Math.round(20 * percentage);
  const emptyProgress = 20 - progress;
  
  const progressText = '▰'.repeat(progress) + '▱'.repeat(emptyProgress);
  return progressText;
}