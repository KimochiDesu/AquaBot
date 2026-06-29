const { SlashCommandBuilder } = require('discord.js');
const { aquaEmbed } = require('../../utils/embed');
const { getGold } = require('../../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription("Check your gold balance blessed by Aqua")
    .addUserOption(o => o.setName('user').setDescription("Check someone else's balance")),

  async execute(interaction) {
    const target = interaction.options.getUser('user') || interaction.user;
    const gold = getGold(target.id);

    await interaction.reply({
      embeds: [aquaEmbed('💛 Gold Balance', `**${target.username}** has **${gold} gold**!\n\nEarn more with \`/daily\`, \`/blackjack\`, and \`/coinflip\`!`)],
    });
  },
};
