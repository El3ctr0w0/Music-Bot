const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Oprește muzica și golește lista'),

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

    await queue.stop();
    await interaction.reply({
      embeds: [{
        color: 0x00ff00,
        title: '⏹️ Oprit',
        description: 'Muzica a fost oprită și lista golită!'
      }]
    });
  }
};