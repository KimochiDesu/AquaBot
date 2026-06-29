const { SlashCommandBuilder } = require('discord.js');
const { aquaEmbed } = require('../../utils/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription("Check AquaBot's response time"),

  async execute(interaction, client) {
    const sent = await interaction.reply({ embeds: [aquaEmbed('💧 Pinging...', 'Measuring...')], fetchReply: true });
    const roundtrip = sent.createdTimestamp - interaction.createdTimestamp;

    await interaction.editReply({
      embeds: [aquaEmbed('💧 Pong!', `**Roundtrip:** ${roundtrip}ms\n**WebSocket:** ${client.ws.ping}ms`)],
    });
  },
};
