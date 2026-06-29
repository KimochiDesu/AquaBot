const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('purify')
    .setDescription("Purify the chat — Aqua's holy cleanse (bulk delete messages)")
    .addIntegerOption(o =>
      o.setName('amount')
        .setDescription('Number of messages to delete (1-100)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    )
    .addUserOption(o => o.setName('user').setDescription('Only delete messages from this user'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    const amount = interaction.options.getInteger('amount');
    const targetUser = interaction.options.getUser('user');

    await interaction.deferReply({ ephemeral: true });

    try {
      const messages = await interaction.channel.messages.fetch({ limit: 100 });
      let toDelete = [...messages.values()];

      if (targetUser) {
        toDelete = toDelete.filter(m => m.author.id === targetUser.id);
      }

      toDelete = toDelete.slice(0, amount);

      // Discord only allows bulk delete for messages < 14 days old
      const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
      toDelete = toDelete.filter(m => m.createdTimestamp > twoWeeksAgo);

      if (toDelete.length === 0) {
        return interaction.editReply({ embeds: [errorEmbed('No eligible messages found. Messages older than 14 days cannot be deleted.')] });
      }

      await interaction.channel.bulkDelete(toDelete, true);

      const who = targetUser ? ` from **${targetUser.tag}**` : '';
      await interaction.editReply({ embeds: [successEmbed('Purified! 💧', `Aqua has cleansed **${toDelete.length}** message(s)${who} from this channel!`)] });
    } catch {
      await interaction.editReply({ embeds: [errorEmbed('Failed to purify. I may not have the right permissions.')] });
    }
  },
};
