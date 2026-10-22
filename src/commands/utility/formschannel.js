const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { successEmbed, errorEmbed, aquaEmbed } = require('../../utils/embed');
const { getFormsChannel, setFormsChannel } = require('../../utils/database');

// What AquaBot needs in the channel to post a form: the embed and the signed sheet image.
const NEEDED = {
  ViewChannel: 'View Channel',
  SendMessages: 'Send Messages',
  EmbedLinks: 'Embed Links',
  AttachFiles: 'Attach Files',
};

function missingPermissions(channel) {
  const perms = channel.permissionsFor(channel.guild.members.me);
  return Object.entries(NEEDED).filter(([flag]) => !perms?.has(PermissionFlagsBits[flag])).map(([, label]) => label);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('formschannel')
    .setDescription('Choose where Axis Cult membership forms from the website are posted')
    .addSubcommand(sub =>
      sub.setName('set')
        .setDescription('Post Axis Cult forms in this channel')
        .addChannelOption(o => o.setName('channel').setDescription('Channel for the forms')
          .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement).setRequired(true))
    )
    .addSubcommand(sub => sub.setName('show').setDescription('Show which channel the forms go to'))
    .addSubcommand(sub => sub.setName('reset').setDescription('Go back to the default (a channel named #forms)'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (sub === 'set') {
      const channel = interaction.options.getChannel('channel');
      const missing = missingPermissions(channel);
      if (missing.length) {
        return interaction.reply({
          embeds: [errorEmbed(`I can't post forms in ${channel} yet. Give me **${missing.join(', ')}** there, then try again.`)],
          ephemeral: true,
        });
      }
      setFormsChannel(guildId, channel.id);
      return interaction.reply({
        embeds: [successEmbed('Forms Channel Set', `New Axis Cult members will be announced in ${channel}. Praise Aqua!`)],
        ephemeral: true,
      });
    }

    if (sub === 'reset') {
      setFormsChannel(guildId, null);
      return interaction.reply({
        embeds: [successEmbed('Forms Channel Reset', 'Forms will go to a channel named **#forms** (or `FORMS_CHANNEL_ID` if the bot has one set).')],
        ephemeral: true,
      });
    }

    const saved = getFormsChannel(guildId);
    const where = saved
      ? `<#${saved}> (set with \`/formschannel set\`)`
      : process.env.FORMS_CHANNEL_ID
        ? `<#${process.env.FORMS_CHANNEL_ID}> (from the bot's settings)`
        : 'a channel named **#forms**, if there is one';
    return interaction.reply({ embeds: [aquaEmbed('⚜ Axis Cult Forms', `Forms from the website are posted in ${where}.`)], ephemeral: true });
  },
};
