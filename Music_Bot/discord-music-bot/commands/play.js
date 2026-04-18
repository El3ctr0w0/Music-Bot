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
    )
    .addBooleanOption(option =>
      option
        .setName('autoplay')
        .setDescription('Dacă bot-ul să continue să pună melodii similare după ce se termină actuala.')
        .setRequired(false)
    ),

  async execute(interaction) {
    // Răspundem la Discord imediat ca să nu primim Timeout (10062 Unknown Interaction)
    try {
      await interaction.deferReply();
    } catch (e) {
      console.error('Nu am putut deferRăspunde', e);
      return; // Oprim comanda dacă a expirat deja conexiunea
    }

    const query = interaction.options.getString('query');
    const autoplay = interaction.options.getBoolean('autoplay');

    // Log pentru debugging
    console.log('=== DEBUG PLAY COMMAND ===');
    console.log('User:', interaction.user.username);
    console.log('Guild:', interaction.guild.name);
    console.log('Channel:', interaction.channel.name);
    console.log('Query parameter:', `"${query}"`);
    console.log('Query type:', typeof query);

    if (!query || query.trim() === '') {
      await interaction.editReply({
        content: '❌ Parametrul pentru melodie este lipsă sau gol.',
      });
      return;
    }

    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      await interaction.editReply({
        content: '❌ Trebuie să fii într-un canal de voce pentru a reda muzică!',
      });
      return;
    }

    try {
      let finalQuery = query;
      // Convertim o simplă căutare în URL cu yt-search pt că am scos YouTubePlugin din Distube. 
      if (!query.startsWith('http')) {
        const ytSearch = require('yt-search');
        const searchResult = await ytSearch(query);
        if (searchResult && searchResult.videos.length > 0) {
          finalQuery = searchResult.videos[0].url;
        }
      }

      await interaction.client.distube.play(voiceChannel, finalQuery, {
        textChannel: interaction.channel,
        member: interaction.member,
      });

      let replyContent = `🎵 Caut melodia: \`${query}\``;

      // Setăm autoplay dacă a fost specificat în comandă
      if (autoplay !== null) {
        const queue = interaction.client.distube.getQueue(interaction.guild);
        if (queue) {
          if (queue.autoplay !== autoplay) {
            queue.toggleAutoplay();
          }
          replyContent += `\n🔄 Autoplay a fost setat pe: **${autoplay ? 'Da' : 'Nu'}**!`;
        }
      }

      await interaction.editReply({
        content: replyContent,
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
