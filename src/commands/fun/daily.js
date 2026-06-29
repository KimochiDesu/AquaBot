const { SlashCommandBuilder } = require('discord.js');
const { aquaEmbed, errorEmbed } = require('../../utils/embed');
const { claimDaily, DAILY_REWARD } = require('../../utils/database');

function formatTimeLeft(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${h}h ${m}m ${s}s`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Claim your daily gold blessed by Aqua! 💰'),

  async execute(interaction) {
    const result = claimDaily(interaction.user.id);

    if (!result.success) {
      return interaction.reply({
        embeds: [errorEmbed(`You already claimed your daily blessing!\nCome back in **${formatTimeLeft(result.timeLeft)}**.`)],
        ephemeral: true,
      });
    }

    await interaction.reply({
      embeds: [aquaEmbed('💰 Daily Blessing Claimed!',
        `Aqua has blessed you with **${result.reward} gold**! 💧\n\n**Total Gold:** ${result.total} 💛`)],
    });
  },
};
