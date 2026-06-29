const { SlashCommandBuilder } = require('discord.js');
const { aquaEmbed } = require('../../utils/embed');

const AQUA_QUOTES = [
  "I am the great Aqua-sama! My beauty and grace are unmatched across all the world!",
  "Do you have any idea who I am?! I'm a goddess! A real one!",
  "Sacred Exorcism! Leave now, foul undead, lest you face my divine wrath!",
  "My healing magic is the finest in all the land. Be grateful!",
  "Water Breathing! I am one with the water... I *am* the water.",
  "I may not be the most capable goddess, but I am definitely the most beautiful!",
  "God Requiem! Take that, you filthy demon!",
  "As long as I'm here, you won't need to fear any undead or evil spirits!",
  "Party Trick! Behold my incredible and dazzling display!",
  "Don't underestimate a goddess's power! Sacred Highness Resurrection!",
  "Blessing! May Aqua's grace shine upon you!",
  "I'm sorry, but even a goddess needs to be appreciated sometimes!",
  "Purification! All evil shall be cleansed by my holy water!",
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('aqua')
    .setDescription('Receive a divine quote from the Goddess Aqua'),

  async execute(interaction) {
    const quote = AQUA_QUOTES[Math.floor(Math.random() * AQUA_QUOTES.length)];
    await interaction.reply({ embeds: [aquaEmbed('💧 The Goddess Speaks...', `*"${quote}"*\n\n— Aqua`)] });
  },
};
