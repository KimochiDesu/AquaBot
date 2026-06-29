const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { errorEmbed, AQUA_BLUE } = require('../../utils/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('announce')
    .setDescription('Send an announcement as AquaBot (Admin only)')
    .addStringOption(o => o.setName('message').setDescription('The announcement message').setRequired(true))
    .addChannelOption(o => o.setName('channel').setDescription('Channel to send to (defaults to current channel)'))
    .addStringOption(o => o.setName('title').setDescription('Optional title for the embed'))
    .addBooleanOption(o => o.setName('ping_everyone').setDescription('Ping @everyone with the announcement'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const message = interaction.options.getString('message');
    const channel = interaction.options.getChannel('channel') || interaction.channel;
    const title = interaction.options.getString('title') || '📢 Announcement';
    const pingEveryone = interaction.options.getBoolean('ping_everyone') ?? false;

    const embed = new EmbedBuilder()
      .setColor(AQUA_BLUE)
      .setTitle(title)
      .setDescription(message)
      .setFooter({ text: `Posted by ${interaction.user.tag} • AquaBot` })
      .setTimestamp();

    try {
      await channel.send({
        content: pingEveryone ? '@everyone' : undefined,
        embeds: [embed],
      });

      await interaction.reply({ embeds: [{ color: 0x00FF7F, description: `✅ Announcement sent in <#${channel.id}>` }], ephemeral: true });
    } catch {
      await interaction.reply({ embeds: [errorEmbed(`I don't have permission to send messages in <#${channel.id}>`)], ephemeral: true });
    }
  },
};
