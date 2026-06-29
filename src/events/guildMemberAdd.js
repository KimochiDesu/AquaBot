const { EmbedBuilder } = require('discord.js');
const { AQUA_BLUE } = require('../utils/embed');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member, client) {
    // Auto-role
    const autoRoleId = process.env.AUTO_ROLE_ID;
    if (autoRoleId) {
      const role = member.guild.roles.cache.get(autoRoleId);
      if (role) await member.roles.add(role).catch(() => {});
    }

    // Welcome message
    const welcomeChannelId = process.env.WELCOME_CHANNEL_ID;
    if (!welcomeChannelId) return;

    const channel = member.guild.channels.cache.get(welcomeChannelId);
    if (!channel) return;

    const aquaWelcomes = [
      `Aqua has blessed your arrival, ${member}! Welcome to **${member.guild.name}**! 💧`,
      `By the power of Aqua, ${member} has been summoned to **${member.guild.name}**! Welcome! 🌊`,
      `Ah, ${member}! Even Aqua herself would be moved by your arrival to **${member.guild.name}**! ✨`,
    ];

    const msg = aquaWelcomes[Math.floor(Math.random() * aquaWelcomes.length)];

    const embed = new EmbedBuilder()
      .setColor(AQUA_BLUE)
      .setTitle('💧 A New Adventurer Has Arrived!')
      .setDescription(msg)
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: 'Member Count', value: `${member.guild.memberCount}`, inline: true },
        { name: 'Account Created', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true }
      )
      .setFooter({ text: 'AquaBot — Blessed by the Goddess Aqua' })
      .setTimestamp();

    await channel.send({ embeds: [embed] });
  },
};
