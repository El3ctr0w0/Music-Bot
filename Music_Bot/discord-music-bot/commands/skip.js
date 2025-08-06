const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Treci la următoarea melodie'),

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

    if (queue.songs.length === 1) {
      return interaction.reply({
        embeds: [{
          color: 0xff0000,
          title: '❌ Eroare',
          description: 'Nu există melodii în listă pentru a sări!'
        }],
        ephemeral: true
      });
    }

    await queue.skip();
    await interaction.reply({
      embeds: [{
        color: 0x00ff00,
        title: '⏭️ Sărit',
        description: 'Am sărit la următoarea melodie!'
      }]
    });
  }
};