const { EmbedBuilder } = require('discord.js');

const AQUA_BLUE = 0x00BFFF;
const AQUA_THUMBNAIL = 'https://i.imgur.com/6XQOIBF.png';

function aquaEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(AQUA_BLUE)
    .setTitle(title)
    .setDescription(description)
    .setThumbnail(AQUA_THUMBNAIL)
    .setFooter({ text: 'AquaBot — Blessed by the Goddess Aqua' })
    .setTimestamp();
}

function successEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(0x00FF7F)
    .setTitle(`✅ ${title}`)
    .setDescription(description)
    .setTimestamp();
}

function errorEmbed(description) {
  return new EmbedBuilder()
    .setColor(0xFF4444)
    .setTitle('❌ Error')
    .setDescription(description)
    .setTimestamp();
}

function modEmbed(action, target, moderator, reason, extra = {}) {
  const embed = new EmbedBuilder()
    .setColor(AQUA_BLUE)
    .setTitle(`🔱 ${action}`)
    .addFields(
      { name: 'User', value: `${target.tag || target} (${target.id || target})`, inline: true },
      { name: 'Moderator', value: moderator.tag, inline: true },
      { name: 'Reason', value: reason || 'No reason provided' }
    )
    .setTimestamp();

  for (const [key, value] of Object.entries(extra)) {
    embed.addFields({ name: key, value: String(value), inline: true });
  }

  return embed;
}

module.exports = { aquaEmbed, successEmbed, errorEmbed, modEmbed, AQUA_BLUE };
