const { SlashCommandBuilder } = require('discord.js');
const { aquaEmbed, errorEmbed } = require('../../utils/embed');
const { getGold, addGold } = require('../../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('coinflip')
    .setDescription('Flip Aqua\'s sacred coin! Bet your gold.')
    .addIntegerOption(o =>
      o.setName('bet')
        .setDescription('Amount of gold to bet')
        .setRequired(true)
        .setMinValue(1)
    )
    .addStringOption(o =>
      o.setName('side')
        .setDescription('Heads or tails?')
        .setRequired(true)
        .addChoices(
          { name: '💧 Heads', value: 'heads' },
          { name: '🌊 Tails', value: 'tails' }
        )
    ),

  async execute(interaction) {
    const bet = interaction.options.getInteger('bet');
    const choice = interaction.options.getString('side');
    const balance = getGold(interaction.user.id);

    if (bet > balance) {
      return interaction.reply({
        embeds: [errorEmbed(`You don't have enough gold! You have **${balance} gold** but tried to bet **${bet}**.`)],
        ephemeral: true,
      });
    }

    const result = Math.random() < 0.5 ? 'heads' : 'tails';
    const won = result === choice;
    const change = won ? bet : -bet;
    const newBalance = addGold(interaction.user.id, change);

    const resultEmoji = result === 'heads' ? '💧' : '🌊';
    const title = won ? '✨ You Won! Aqua blesses you!' : '💧 Aqua weeps... You lost!';
    const desc = [
      `The coin landed on **${resultEmoji} ${result}**!`,
      won
        ? `You win **${bet} gold**! Well played, adventurer!`
        : `You lost **${bet} gold**. Better luck next time!`,
      `**New Balance:** ${newBalance} gold 💛`,
    ].join('\n');

    await interaction.reply({ embeds: [aquaEmbed(title, desc)] });
  },
};
