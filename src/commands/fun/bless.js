const { SlashCommandBuilder } = require('discord.js');
const { aquaEmbed } = require('../../utils/embed');

const BLESSINGS = [
  "May the sacred waters of Aqua wash away your troubles and fill your heart with joy!",
  "Aqua bestows upon you her divine blessing! Fortune and happiness shall follow you!",
  "By the holy power of Aqua, you are shielded from all misfortune and evil!",
  "The Goddess blesses you with clarity, strength, and overflowing luck!",
  "Aqua's grace surrounds you! May your adventures be legendary and your loot be plentiful!",
  "Sacred blessing! Aqua herself has chosen to shine her light upon you today!",
  "With Aqua's blessing, even the undead dare not approach you!",
  "May your path be ever bright, guided by the divine light of the Goddess Aqua!",
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bless')
    .setDescription("Bless a member with Aqua's divine power")
    .addUserOption(o => o.setName('user').setDescription('Who to bless').setRequired(true)),

  async execute(interaction) {
    const target = interaction.options.getUser('user');
    const blessing = BLESSINGS[Math.floor(Math.random() * BLESSINGS.length)];

    await interaction.reply({
      embeds: [aquaEmbed('✨ Divine Blessing!', `${target}, ${blessing}`)],
    });
  },
};
