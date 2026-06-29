const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed, modEmbed } = require('../../utils/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Unban a user by their ID')
    .addStringOption(o => o.setName('userid').setDescription('User ID to unban').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason for unban'))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    const userId = interaction.options.getString('userid');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    try {
      const ban = await interaction.guild.bans.fetch(userId).catch(() => null);
      if (!ban) {
        return interaction.reply({ embeds: [errorEmbed('That user is not banned.')], ephemeral: true });
      }

      await interaction.guild.members.unban(userId, reason);

      await interaction.reply({ embeds: [successEmbed('User Unbanned', `**${ban.user.tag}** has been forgiven by Aqua's mercy!\n**Reason:** ${reason}`)] });

      const logChannel = interaction.guild.channels.cache.get(process.env.MOD_LOG_CHANNEL_ID);
      if (logChannel) {
        await logChannel.send({ embeds: [modEmbed('🔓 Unban', ban.user, interaction.user, reason)] });
      }
    } catch {
      await interaction.reply({ embeds: [errorEmbed('Failed to unban that user. Check the ID is correct.')], ephemeral: true });
    }
  },
};
