const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pune pauză muzicii'),

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

    if (queue.paused) {
      queue.resume();
      await interaction.reply({
        embeds: [{
          color: 0x00ff00,
          title: '▶️ Reluat',
          description: 'Muzica a fost reluată!'
        }]
      });
    } else {
      queue.pause();
      await interaction.reply({
        embeds: [{
          color: 0xffff00,
          title: '⏸️ Pauză',
          description: 'Muzica a fost pusă pe pauză!'
        }]
      });
    }
  }
};