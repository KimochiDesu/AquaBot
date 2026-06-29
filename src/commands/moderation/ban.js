const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed, modEmbed } = require('../../utils/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a member from the server')
    .addUserOption(o => o.setName('user').setDescription('User to ban').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason for ban'))
    .addIntegerOption(o => o.setName('days').setDescription('Days of messages to delete (0-7)').setMinValue(0).setMaxValue(7))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    const target = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const days = interaction.options.getInteger('days') || 0;

    const member = await interaction.guild.members.fetch(target.id).catch(() => null);

    if (member) {
      if (!member.bannable) {
        return interaction.reply({ embeds: [errorEmbed('I cannot ban that user. They may have higher permissions than me.')], ephemeral: true });
      }
      if (member.id === interaction.user.id) {
        return interaction.reply({ embeds: [errorEmbed("You can't ban yourself! Even Aqua wouldn't do that.")], ephemeral: true });
      }
    }

    try {
      await interaction.guild.members.ban(target.id, { reason, deleteMessageSeconds: days * 86400 });

      await interaction.reply({ embeds: [successEmbed('User Banned', `**${target.tag}** has been banished by Aqua's divine power!\n**Reason:** ${reason}`)] });

      const logChannel = interaction.guild.channels.cache.get(process.env.MOD_LOG_CHANNEL_ID);
      if (logChannel) {
        await logChannel.send({ embeds: [modEmbed('🔨 Ban', target, interaction.user, reason, { 'Messages Deleted': `${days} day(s)` })] });
      }
    } catch {
      await interaction.reply({ embeds: [errorEmbed('Failed to ban that user.')], ephemeral: true });
    }
  },
};
