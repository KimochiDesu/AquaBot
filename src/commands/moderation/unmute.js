const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed, modEmbed } = require('../../utils/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Remove a timeout from a member')
    .addUserOption(o => o.setName('user').setDescription('User to unmute').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason for unmute'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const target = interaction.options.getMember('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    if (!target) return interaction.reply({ embeds: [errorEmbed('User not found in this server.')], ephemeral: true });
    if (!target.isCommunicationDisabled()) return interaction.reply({ embeds: [errorEmbed('That user is not currently muted.')], ephemeral: true });

    try {
      await target.timeout(null, reason);

      await interaction.reply({ embeds: [successEmbed('User Unmuted', `**${target.user.tag}** can speak again!\n**Reason:** ${reason}`)] });

      const logChannel = interaction.guild.channels.cache.get(process.env.MOD_LOG_CHANNEL_ID);
      if (logChannel) {
        await logChannel.send({ embeds: [modEmbed('🔊 Unmute', target.user, interaction.user, reason)] });
      }
    } catch {
      await interaction.reply({ embeds: [errorEmbed('Failed to unmute that user.')], ephemeral: true });
    }
  },
};
