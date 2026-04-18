const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Redă o melodie din YouTube, Spotify, SoundCloud etc.')
    .addStringOption(option =>
      option
        .setName('query') // ← numele opțiunii trebuie să corespundă cu ce primești în loguri
        .setDescription('Numele melodiei sau link-ul')
        .setRequired(true)
    ),

  async execute(interaction) {
    const query = interaction.options.getString('query');

    // Log pentru debugging
    console.log('=== DEBUG PLAY COMMAND ===');
    console.log('User:', interaction.user.username);
    console.log('Guild:', interaction.guild.name);
    console.log('Channel:', interaction.channel.name);
    console.log('Query parameter:', `"${query}"`);
    console.log('Query type:', typeof query);

    if (!query || query.trim() === '') {
      await interaction.reply({
        content: '❌ Parametrul pentru melodie este lipsă sau gol.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      await interaction.reply({
        content: '❌ Trebuie să fii într-un canal de voce pentru a reda muzică!',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    try {
      await interaction.deferReply();
      
      await interaction.client.distube.play(voiceChannel, query, {
        textChannel: interaction.channel,
        member: interaction.member,
      });

      await interaction.editReply({
        content: `🎵 Caut melodia: \`${query}\``,
      });
    } catch (error) {
      console.error('Eroare la redare:', error);

      let errMsg = '❌ A apărut o eroare la redare.';
      if (
        typeof error.message === 'string' &&
        (error.message.includes('fragment') || error.message.includes('403') || error.message.includes('Forbidden'))
      ) {
        errMsg = '❌ Link invalid sau restricționat. Încearcă altul.';
      }

      await interaction.editReply({
        content: errMsg,
      });
    }
  },
};
