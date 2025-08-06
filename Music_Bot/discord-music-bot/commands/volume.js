const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Schimbă volumul muzicii')
    .addIntegerOption(option =>
      option.setName('level')
        .setDescription('Nivelul volumului (1-100)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    ),

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

    const volume = interaction.options.getInteger('level');
    queue.setVolume(volume);

    await interaction.reply({
      embeds: [{
        color: 0x00ff00,
        title: '🔊 Volum schimbat',
        description: `Volumul a fost setat la ${volume}%`
      }]
    });
  }
};