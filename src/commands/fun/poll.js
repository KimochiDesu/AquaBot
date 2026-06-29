const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { AQUA_BLUE } = require('../../utils/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('poll')
    .setDescription('Create a quick yes/no poll blessed by Aqua')
    .addStringOption(o => o.setName('question').setDescription('The poll question').setRequired(true)),

  async execute(interaction) {
    const question = interaction.options.getString('question');

    const embed = new EmbedBuilder()
      .setColor(AQUA_BLUE)
      .setTitle('📊 Aqua\'s Divine Poll')
      .setDescription(`**${question}**`)
      .addFields(
        { name: '✅ Yes', value: 'React with ✅', inline: true },
        { name: '❌ No', value: 'React with ❌', inline: true },
      )
      .setFooter({ text: `Poll created by ${interaction.user.tag} • AquaBot` })
      .setTimestamp();

    const message = await interaction.reply({ embeds: [embed], fetchReply: true });
    await message.react('✅');
    await message.react('❌');
  },
};
