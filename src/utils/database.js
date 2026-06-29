const fs = require('fs');
const path = require('path');

const WARNINGS_PATH = path.join(__dirname, '../../data/warnings.json');
const REACTION_ROLES_PATH = path.join(__dirname, '../../data/reactionRoles.json');
const ECONOMY_PATH = path.join(__dirname, '../../data/economy.json');

function readJSON(filePath) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '{}');
    return {};
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Warnings
function addWarning(guildId, userId, reason, moderatorId) {
  const data = readJSON(WARNINGS_PATH);
  if (!data[guildId]) data[guildId] = {};
  if (!data[guildId][userId]) data[guildId][userId] = [];
  data[guildId][userId].push({ reason, moderatorId, timestamp: Date.now() });
  writeJSON(WARNINGS_PATH, data);
  return data[guildId][userId].length;
}

function getWarnings(guildId, userId) {
  const data = readJSON(WARNINGS_PATH);
  return data[guildId]?.[userId] || [];
}

function clearWarnings(guildId, userId) {
  const data = readJSON(WARNINGS_PATH);
  if (data[guildId]?.[userId]) {
    data[guildId][userId] = [];
    writeJSON(WARNINGS_PATH, data);
  }
}

// Reaction Roles
function setReactionRole(guildId, messageId, emoji, roleId) {
  const data = readJSON(REACTION_ROLES_PATH);
  if (!data[guildId]) data[guildId] = {};
  if (!data[guildId][messageId]) data[guildId][messageId] = {};
  data[guildId][messageId][emoji] = roleId;
  writeJSON(REACTION_ROLES_PATH, data);
}

function getReactionRole(guildId, messageId, emoji) {
  const data = readJSON(REACTION_ROLES_PATH);
  return data[guildId]?.[messageId]?.[emoji] || null;
}

function removeReactionRole(guildId, messageId, emoji) {
  const data = readJSON(REACTION_ROLES_PATH);
  if (data[guildId]?.[messageId]?.[emoji]) {
    delete data[guildId][messageId][emoji];
    writeJSON(REACTION_ROLES_PATH, data);
    return true;
  }
  return false;
}

// Economy
const DAILY_COOLDOWN = 24 * 60 * 60 * 1000;
const DAILY_REWARD = 500;

function getEconomy(userId) {
  const data = readJSON(ECONOMY_PATH);
  if (!data[userId]) data[userId] = { gold: 0, lastDaily: 0 };
  return data[userId];
}

function saveEconomy(userId, record) {
  const data = readJSON(ECONOMY_PATH);
  data[userId] = record;
  writeJSON(ECONOMY_PATH, data);
}

function getGold(userId) {
  return getEconomy(userId).gold;
}

function addGold(userId, amount) {
  const record = getEconomy(userId);
  record.gold = Math.max(0, record.gold + amount);
  saveEconomy(userId, record);
  return record.gold;
}

function claimDaily(userId) {
  const record = getEconomy(userId);
  const now = Date.now();
  const timeLeft = DAILY_COOLDOWN - (now - record.lastDaily);
  if (timeLeft > 0) return { success: false, timeLeft };
  record.gold += DAILY_REWARD;
  record.lastDaily = now;
  saveEconomy(userId, record);
  return { success: true, reward: DAILY_REWARD, total: record.gold };
}

module.exports = {
  addWarning, getWarnings, clearWarnings,
  setReactionRole, getReactionRole, removeReactionRole,
  getGold, addGold, claimDaily, DAILY_REWARD,
};
