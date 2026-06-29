const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed, aquaEmbed } = require('../../utils/embed');
const { setReactionRole, removeReactionRole } = require('../../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reactionrole')
    .setDescription('Manage reaction roles')
    .addSubcommand(sub =>
      sub.setName('add')
        .setDescription('Bind an emoji to a role on a message')
        .addStringOption(o => o.setName('messageid').setDescription('Message ID').setRequired(true))
        .addStringOption(o => o.setName('emoji').setDescription('Emoji to react with (e.g. 💧 or :custom:)').setRequired(true))
        .addRoleOption(o => o.setName('role').setDescription('Role to assign').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('remove')
        .setDescription('Remove a reaction role binding')
        .addStringOption(o => o.setName('messageid').setDescription('Message ID').setRequired(true))
        .addStringOption(o => o.setName('emoji').setDescription('Emoji to remove').setRequired(true))
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const messageId = interaction.options.getString('messageid');
    const emoji = interaction.options.getString('emoji');

    if (sub === 'add') {
      const role = interaction.options.getRole('role');

      const message = await interaction.channel.messages.fetch(messageId).catch(() => null);
      if (!message) {
        return interaction.reply({ embeds: [errorEmbed('Message not found in this channel. Make sure you run this in the same channel as the message.')], ephemeral: true });
      }

      setReactionRole(interaction.guild.id, messageId, emoji, role.id);

      try {
        await message.react(emoji);
      } catch {
        return interaction.reply({ embeds: [errorEmbed(`Could not react with ${emoji}. Make sure the emoji is valid and accessible by the bot.`)], ephemeral: true });
      }

      await interaction.reply({
        embeds: [successEmbed('Reaction Role Added', `Reacting with ${emoji} on [that message](${message.url}) will now give the **${role.name}** role!`)],
        ephemeral: true,
      });
    }

    if (sub === 'remove') {
      const removed = removeReactionRole(interaction.guild.id, messageId, emoji);
      if (!removed) {
        return interaction.reply({ embeds: [errorEmbed('No reaction role found for that emoji on that message.')], ephemeral: true });
      }

      await interaction.reply({
        embeds: [successEmbed('Reaction Role Removed', `The ${emoji} reaction role binding has been removed.`)],
        ephemeral: true,
      });
    }
  },
};
