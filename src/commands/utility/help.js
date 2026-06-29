const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { AQUA_BLUE } = require('../../utils/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('View all of AquaBot\'s commands'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(AQUA_BLUE)
      .setTitle('💧 AquaBot — Command Guide')
      .setDescription('*Blessed by the Goddess Aqua herself!*')
      .addFields(
        {
          name: '🔨 Moderation',
          value: [
            '`/ban` — Ban a member',
            '`/unban` — Unban a user by ID',
            '`/kick` — Kick a member',
            '`/mute` — Timeout a member',
            '`/unmute` — Remove a timeout',
            '`/warn add/list/clear` — Warning system',
            '`/purify` — Bulk delete messages',
          ].join('\n'),
        },
        {
          name: '🌊 Roles',
          value: [
            '`/reactionrole add` — Bind emoji → role on a message',
            '`/reactionrole remove` — Remove a binding',
          ].join('\n'),
        },
        {
          name: '✨ Fun & Economy',
          value: [
            '`/aqua` — Get an Aqua quote',
            '`/bless` — Bless a member with Aqua\'s divine power',
            '`/poll` — Create a quick yes/no poll',
            '`/daily` — Claim 500 gold every 24h',
            '`/balance` — Check your gold balance',
            '`/coinflip` — Bet gold on heads or tails',
            '`/blackjack` — Play blackjack at Aqua\'s table',
          ].join('\n'),
        },
        {
          name: '🔍 Utility',
          value: [
            '`/ping` — Check bot latency',
            '`/serverinfo` — View server info',
            '`/userinfo` — View user info',
            '`/announce [channel] message` — Admin-only bot announcement',
            '`/help` — This menu',
          ].join('\n'),
        }
      )
      .setFooter({ text: 'AquaBot — Blessed by the Goddess Aqua' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
