const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed, modEmbed } = require('../../utils/embed');

const DURATION_MAP = {
  '60': 60,
  '300': 300,
  '600': 600,
  '1800': 1800,
  '3600': 3600,
  '21600': 21600,
  '43200': 43200,
  '86400': 86400,
  '259200': 259200,
  '604800': 604800,
};

function formatDuration(seconds) {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${seconds / 60}m`;
  if (seconds < 86400) return `${seconds / 3600}h`;
  return `${seconds / 86400}d`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Timeout (mute) a member')
    .addUserOption(o => o.setName('user').setDescription('User to mute').setRequired(true))
    .addStringOption(o =>
      o.setName('duration')
        .setDescription('How long to mute')
        .setRequired(true)
        .addChoices(
          { name: '1 minute', value: '60' },
          { name: '5 minutes', value: '300' },
          { name: '10 minutes', value: '600' },
          { name: '30 minutes', value: '1800' },
          { name: '1 hour', value: '3600' },
          { name: '6 hours', value: '21600' },
          { name: '12 hours', value: '43200' },
          { name: '1 day', value: '86400' },
          { name: '3 days', value: '259200' },
          { name: '1 week', value: '604800' }
        )
    )
    .addStringOption(o => o.setName('reason').setDescription('Reason for mute'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const target = interaction.options.getMember('user');
    const durationSeconds = parseInt(interaction.options.getString('duration'));
    const reason = interaction.options.getString('reason') || 'No reason provided';

    if (!target) return interaction.reply({ embeds: [errorEmbed('User not found in this server.')], ephemeral: true });
    if (!target.moderatable) return interaction.reply({ embeds: [errorEmbed('I cannot mute that user.')], ephemeral: true });
    if (target.id === interaction.user.id) return interaction.reply({ embeds: [errorEmbed("You can't mute yourself!")], ephemeral: true });

    try {
      await target.timeout(durationSeconds * 1000, reason);

      const duration = formatDuration(durationSeconds);
      await interaction.reply({ embeds: [successEmbed('User Muted', `**${target.user.tag}** has been silenced for **${duration}**!\n**Reason:** ${reason}`)] });

      const logChannel = interaction.guild.channels.cache.get(process.env.MOD_LOG_CHANNEL_ID);
      if (logChannel) {
        await logChannel.send({ embeds: [modEmbed('🔇 Mute', target.user, interaction.user, reason, { Duration: duration })] });
      }
    } catch {
      await interaction.reply({ embeds: [errorEmbed('Failed to mute that user.')], ephemeral: true });
    }
  },
};
