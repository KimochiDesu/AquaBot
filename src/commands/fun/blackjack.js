const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const { AQUA_BLUE, errorEmbed } = require('../../utils/embed');
const { getGold, addGold } = require('../../utils/database');

const SUITS = ['♠', '♥', '♦', '♣'];
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function buildDeck() {
  const deck = [];
  for (const suit of SUITS) for (const val of VALUES) deck.push({ suit, val });
  return deck.sort(() => Math.random() - 0.5);
}

function cardValue(card) {
  if (['J', 'Q', 'K'].includes(card.val)) return 10;
  if (card.val === 'A') return 11;
  return parseInt(card.val);
}

function handTotal(hand) {
  let total = hand.reduce((sum, c) => sum + cardValue(c), 0);
  let aces = hand.filter(c => c.val === 'A').length;
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return total;
}

function handStr(hand, hideSecond = false) {
  return hand.map((c, i) => (hideSecond && i === 1) ? '🂠' : `${c.val}${c.suit}`).join('  ');
}

function buildEmbed(playerHand, dealerHand, bet, balance, status, hideDealer = true) {
  const dealerTotal = hideDealer ? '?' : handTotal(dealerHand);
  const playerTotal = handTotal(playerHand);

  return new EmbedBuilder()
    .setColor(status === 'playing' ? AQUA_BLUE : status === 'win' ? 0x00FF7F : status === 'push' ? 0xFFAA00 : 0xFF4444)
    .setTitle('🃏 Aqua\'s Sacred Blackjack')
    .addFields(
      { name: `Dealer (${dealerTotal})`, value: handStr(dealerHand, hideDealer), inline: false },
      { name: `You (${playerTotal})`, value: handStr(playerHand), inline: false },
      { name: 'Bet', value: `${bet} gold`, inline: true },
      { name: 'Balance', value: `${balance} gold`, inline: true },
    )
    .setFooter({ text: 'AquaBot Blackjack — May Aqua bless your hand! 💧' });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('blackjack')
    .setDescription("Play blackjack at Aqua's sacred table!")
    .addIntegerOption(o =>
      o.setName('bet')
        .setDescription('Amount of gold to bet')
        .setRequired(true)
        .setMinValue(1)
    ),

  async execute(interaction) {
    const bet = interaction.options.getInteger('bet');
    let balance = getGold(interaction.user.id);

    if (bet > balance) {
      return interaction.reply({
        embeds: [errorEmbed(`You don't have enough gold! You have **${balance} gold**.`)],
        ephemeral: true,
      });
    }

    const deck = buildDeck();
    const playerHand = [deck.pop(), deck.pop()];
    const dealerHand = [deck.pop(), deck.pop()];

    // Natural blackjack check
    if (handTotal(playerHand) === 21) {
      const winnings = Math.floor(bet * 1.5);
      balance = addGold(interaction.user.id, winnings);
      return interaction.reply({
        embeds: [buildEmbed(playerHand, dealerHand, bet, balance, 'win', false)
          .setDescription(`**BLACKJACK!** Aqua blesses you with **+${winnings} gold**! 🎉`)],
      });
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('hit').setLabel('Hit 🃏').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('stand').setLabel('Stand ✋').setStyle(ButtonStyle.Secondary),
    );

    const reply = await interaction.reply({
      embeds: [buildEmbed(playerHand, dealerHand, bet, balance, 'playing')],
      components: [row],
      fetchReply: true,
    });

    const collector = reply.createMessageComponentCollector({
      componentType: ComponentType.Button,
      filter: i => i.user.id === interaction.user.id,
      time: 60_000,
    });

    collector.on('collect', async i => {
      if (i.customId === 'hit') {
        playerHand.push(deck.pop());
        const total = handTotal(playerHand);

        if (total > 21) {
          balance = addGold(interaction.user.id, -bet);
          collector.stop('bust');
          return i.update({
            embeds: [buildEmbed(playerHand, dealerHand, bet, balance, 'lose', false)
              .setDescription(`**Bust!** You went over 21 and lost **${bet} gold**. Aqua sheds a tear. 💧`)],
            components: [],
          });
        }

        if (total === 21) {
          collector.stop('stand');
          return i.update({ embeds: [buildEmbed(playerHand, dealerHand, bet, balance, 'playing')], components: [row.setComponents(
            new ButtonBuilder().setCustomId('hit').setLabel('Hit 🃏').setStyle(ButtonStyle.Primary).setDisabled(true),
            new ButtonBuilder().setCustomId('stand').setLabel('Stand ✋').setStyle(ButtonStyle.Secondary),
          )] });
        }

        await i.update({ embeds: [buildEmbed(playerHand, dealerHand, bet, balance, 'playing')], components: [row] });
      }

      if (i.customId === 'stand') {
        collector.stop('stand');

        // Dealer plays
        while (handTotal(dealerHand) < 17) dealerHand.push(deck.pop());

        const playerTotal = handTotal(playerHand);
        const dealerTotal = handTotal(dealerHand);

        let status, desc;
        if (dealerTotal > 21 || playerTotal > dealerTotal) {
          balance = addGold(interaction.user.id, bet);
          status = 'win';
          desc = `You beat the dealer (**${playerTotal}** vs **${dealerTotal}**)! Aqua cheers! **+${bet} gold** 🎉`;
        } else if (playerTotal === dealerTotal) {
          status = 'push';
          desc = `Push! It's a tie (**${playerTotal}** vs **${dealerTotal}**). Your bet is returned. 💧`;
        } else {
          balance = addGold(interaction.user.id, -bet);
          status = 'lose';
          desc = `Dealer wins (**${dealerTotal}** vs **${playerTotal}**). You lost **${bet} gold**. Aqua weeps. 💧`;
        }

        await i.update({
          embeds: [buildEmbed(playerHand, dealerHand, bet, balance, status, false).setDescription(desc)],
          components: [],
        });
      }
    });

    collector.on('end', async (_, reason) => {
      if (reason === 'time') {
        balance = addGold(interaction.user.id, -bet);
        await reply.edit({
          embeds: [buildEmbed(playerHand, dealerHand, bet, balance, 'lose', false)
            .setDescription(`Time's up! You forfeited **${bet} gold**. Aqua is disappointed. 💧`)],
          components: [],
        }).catch(() => {});
      }
    });
  },
};
