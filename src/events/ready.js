const { ActivityType } = require('discord.js');
const { setAquaThumbnail } = require('../utils/embed');

module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    console.log(`✅ Logged in as ${client.user.tag}`);
    setAquaThumbnail(client.user.displayAvatarURL({ size: 256 }));
    client.user.setPresence({
      activities: [{ name: 'over the party | /help', type: ActivityType.Watching }],
      status: 'online',
    });
  },
};
