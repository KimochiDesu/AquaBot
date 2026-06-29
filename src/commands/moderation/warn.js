const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed, modEmbed, aquaEmbed } = require('../../utils/embed');
const { addWarning, getWarnings, clearWarnings } = require('../../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warning management')
    .addSubcommand(sub =>
      sub.setName('add')
        .setDescription('Warn a member')
        .addUserOption(o => o.setName('user').setDescription('User to warn').setRequired(true))
        .addStringOption(o => o.setName('reason').setDescription('Reason for warning').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('list')
        .setDescription('View warnings for a member')
        .addUserOption(o => o.setName('user').setDescription('User to check').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('clear')
        .setDescription('Clear all warnings for a member')
        .addUserOption(o => o.setName('user').setDescription('User to clear').setRequired(true))
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const target = interaction.options.getUser('user');

    if (sub === 'add') {
      const reason = interaction.options.getString('reason');
      const count = addWarning(interaction.guild.id, target.id, reason, interaction.user.id);

      await interaction.reply({ embeds: [successEmbed('Warning Issued', `**${target.tag}** has been warned.\n**Reason:** ${reason}\n**Total Warnings:** ${count}`)] });

      const logChannel = interaction.guild.channels.cache.get(process.env.MOD_LOG_CHANNEL_ID);
      if (logChannel) {
        await logChannel.send({ embeds: [modEmbed('⚠️ Warn', target, interaction.user, reason, { 'Total Warnings': count })] });
      }
    }

    if (sub === 'list') {
      const warnings = getWarnings(interaction.guild.id, target.id);
      if (warnings.length === 0) {
        return interaction.reply({ embeds: [aquaEmbed('Warnings', `**${target.tag}** has no warnings. Clean as Aqua's sacred water! 💧`)] });
      }

      const list = warnings.map((w, i) =>
        `**${i + 1}.** ${w.reason} — <t:${Math.floor(w.timestamp / 1000)}:R>`
      ).join('\n');

      await interaction.reply({ embeds: [aquaEmbed(`Warnings for ${target.tag}`, list)] });
    }

    if (sub === 'clear') {
      clearWarnings(interaction.guild.id, target.id);
      await interaction.reply({ embeds: [successEmbed('Warnings Cleared', `All warnings for **${target.tag}** have been washed away by Aqua! 💧`)] });
    }
  },
};
