const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const path = require('path');
const { AttachmentBuilder, ChannelType, escapeMarkdown } = require('discord.js');
const { aquaEmbed } = require('../utils/embed');
const { getFormsChannel } = require('../utils/database');

// Receives Axis Cult membership forms from the portfolio site and posts them to #forms.
// The site sends JSON: { fields: { name, gender, age, contact, profession, recruited }, device, image: "data:image/jpeg;base64,..." }
// Each person may pledge once: a second form from the same IP, browser or contact details is refused.

const FIELDS = {
  name: 'Name',
  gender: 'Gender',
  age: 'Age',
  contact: 'Contact Details',
  profession: 'Profession',
  recruited: 'Recruited By',
};
const MAX_BODY_BYTES = 2 * 1024 * 1024;
const MAX_IMAGE_BYTES = 1.5 * 1024 * 1024;
const MAX_FIELD_LENGTH = 60;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 3;

// The Axis Cult emblem, served by the portfolio site.
const FORM_THUMBNAIL = process.env.FORM_THUMBNAIL || 'https://www.k1mochi.cloud/img/axisform/emblem.png';

const DEFAULT_ORIGINS ='https://kimochidesu.github.io,http://localhost:5173,http://127.0.0.1:5173';

const DEFAULT_LEDGER = path.join(__dirname, '../../data/axisForms.json');

/**
 * Who has already pledged, kept on disk so it survives restarts. Only salted hashes are stored,
 * never raw IPs or contact details.
 */
function createLedger(file) {
  const salt = process.env.FORM_SALT || 'axis-cult';
  const hash = value => crypto.createHash('sha256').update(`${salt}|${value}`).digest('hex').slice(0, 32);
  let seen = new Set();
  try {
    seen = new Set(JSON.parse(fs.readFileSync(file, 'utf8')).seen);
  } catch {
    // No ledger yet.
  }
  const keysFor = ({ ip, device, contact }) => [
    ip && `ip:${ip}`,
    device && `device:${device}`,
    contact && `contact:${contact.toLowerCase().replace(/\s+/g, '')}`,
  ].filter(Boolean).map(hash);
  const pending = new Set();   // forms being posted right now, so two at once can't both get through
  return {
    /** Claims this person's spot; false if they already pledged or a form of theirs is in flight. */
    hold: who => {
      const keys = keysFor(who);
      if (keys.some(k => seen.has(k) || pending.has(k))) return false;
      keys.forEach(k => pending.add(k));
      return true;
    },
    release: who => keysFor(who).forEach(k => pending.delete(k)),
    add: who => {
      keysFor(who).forEach(k => { pending.delete(k); seen.add(k); });
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, JSON.stringify({ seen: [...seen] }));
    },
  };
}

function allowedOrigins() {
  return (process.env.FORM_ORIGINS || DEFAULT_ORIGINS).split(',').map(s => s.trim()).filter(Boolean);
}

/**
 * Where forms go, in order: the channel an admin chose with /formschannel, FORMS_CHANNEL_ID,
 * then a text channel named "forms". Only GUILD_ID's server is used when that is set.
 */
async function findFormsChannel(client) {
  const guilds = process.env.GUILD_ID
    ? [client.guilds.cache.get(process.env.GUILD_ID)].filter(Boolean)
    : [...client.guilds.cache.values()];
  for (const guild of guilds) {
    const chosen = getFormsChannel(guild.id);
    const channel = chosen && await client.channels.fetch(chosen).catch(() => null);
    if (channel) return channel;
  }
  if (process.env.FORMS_CHANNEL_ID) {
    return client.channels.fetch(process.env.FORMS_CHANNEL_ID).catch(() => null);
  }
  for (const guild of guilds) {
    const channel = guild.channels.cache.find(c => c.type === ChannelType.GuildText && c.name === 'forms');
    if (channel) return channel;
  }
  return null;
}

/** Checks the submitted form; returns { fields, image } or throws a message for the site. */
function parseForm(body) {
  let data;
  try {
    data = JSON.parse(body);
  } catch {
    throw new Error('Invalid JSON.');
  }
  const fields = {};
  for (const key of Object.keys(FIELDS)) {
    const raw = typeof data?.fields?.[key] === 'string' ? data.fields[key] : '';
    // No control characters or newlines; Discord shows one line per field.
    fields[key] = raw.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, MAX_FIELD_LENGTH);
  }
  if (!fields.name) throw new Error('Name is required.');
  // A random ID the site keeps in the visitor's browser.
  const device = typeof data?.device === 'string' && /^[A-Za-z0-9-]{8,64}$/.test(data.device) ? data.device : '';

  const match = /^data:image\/(jpeg|png);base64,([A-Za-z0-9+/=]+)$/.exec(data?.image || '');
  if (!match) throw new Error('The signed sheet image is missing.');
  const image = Buffer.from(match[2], 'base64');
  if (image.length > MAX_IMAGE_BYTES) throw new Error('The sheet image is too large.');
  const isJpeg = image[0] === 0xff && image[1] === 0xd8 && image[2] === 0xff;
  const isPng = image.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  if (!isJpeg && !isPng) throw new Error('The sheet must be a JPEG or PNG image.');

  return { fields, device, image, ext: isJpeg ? 'jpg' : 'png' };
}

async function postForm(channel, { fields, image, ext }) {
  const fileName = `axis-cult-form.${ext}`;
  const embed = aquaEmbed(`⚜ New Axis Cult member: ${escapeMarkdown(fields.name)}`, 'A new believer has signed the pledge. Praise Aqua!')
    .addFields(Object.entries(FIELDS).map(([key, label]) => ({
      name: label,
      value: fields[key] ? escapeMarkdown(fields[key]) : '—',
      inline: key !== 'contact',
    })))
    .setImage(`attachment://${fileName}`)
    .setThumbnail(FORM_THUMBNAIL);
  await channel.send({
    embeds: [embed],
    files: [new AttachmentBuilder(image, { name: fileName })],
    allowedMentions: { parse: [] },   // a name like "@everyone" must not ping anyone
  });
}

/**
 * Builds the HTTP server. `getChannel` is injectable so the request handling can be tested
 * without logging in to Discord.
 */
function createFormServer({ getChannel, ledgerFile = DEFAULT_LEDGER }) {
  const hits = new Map();   // ip -> timestamps of recent submissions
  const ledger = createLedger(ledgerFile);

  const limited = ip => {
    const now = Date.now();
    const recent = (hits.get(ip) || []).filter(t => now - t < RATE_WINDOW_MS);
    hits.set(ip, recent);
    if (recent.length >= RATE_MAX) return true;
    recent.push(now);
    return false;
  };

  return http.createServer((req, res) => {
    const origin = req.headers.origin || '';
    const originOk = allowedOrigins().includes(origin);
    const send = (status, payload) => {
      const headers = { 'Content-Type': 'application/json' };
      if (originOk) {
        headers['Access-Control-Allow-Origin'] = origin;
        headers.Vary = 'Origin';
      }
      res.writeHead(status, headers);
      res.end(JSON.stringify(payload));
    };

    if (req.method === 'GET' && req.url === '/health') return send(200, { ok: true });
    if (req.url !== '/axis-form') return send(404, { error: 'Not found.' });

    if (req.method === 'OPTIONS') {
      if (!originOk) return send(403, { error: 'Origin not allowed.' });
      res.writeHead(204, {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '600',
        Vary: 'Origin',
      });
      return res.end();
    }
    if (req.method !== 'POST') return send(405, { error: 'Use POST.' });
    if (!originOk) return send(403, { error: 'Origin not allowed.' });

    // Behind Cloudflare Tunnel every request arrives from localhost; the visitor's IP is in CF-Connecting-IP.
    const local = ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress);
    const ip = (local && req.headers['cf-connecting-ip']) || req.socket.remoteAddress;
    if (limited(ip)) return send(429, { error: 'Too many forms. Try again in a few minutes.' });

    let size = 0;
    const chunks = [];
    req.on('data', chunk => {
      size += chunk.length;
      // Too big: stop keeping it, but read the rest so the browser gets the 413 instead of a reset.
      // Past 4x the limit, just drop the connection.
      if (size > 4 * MAX_BODY_BYTES) req.destroy();
      else if (size <= MAX_BODY_BYTES) chunks.push(chunk);
    });
    req.on('end', async () => {
      if (size > MAX_BODY_BYTES) return send(413, { error: 'Form too large.' });
      let form;
      try {
        form = parseForm(Buffer.concat(chunks).toString('utf8'));
      } catch (e) {
        return send(400, { error: e.message });
      }
      const who = { ip, device: form.device, contact: form.fields.contact };
      if (!ledger.hold(who)) return send(409, { error: 'You have already pledged. One form per person.' });
      try {
        const channel = await getChannel();
        if (!channel) {
          ledger.release(who);
          return send(503, { error: 'The #forms channel was not found.' });
        }
        await postForm(channel, form);
        ledger.add(who);
        send(200, { ok: true });
      } catch (e) {
        ledger.release(who);   // nothing was posted, so they may try again
        console.error('Axis form: could not post to Discord:', e);
        send(502, { error: 'Could not post to Discord.' });
      }
    });
  });
}

function startFormServer(client) {
  const port = Number(process.env.FORM_PORT || 8787);
  const server = createFormServer({ getChannel: () => findFormsChannel(client) });
  server.listen(port, process.env.FORM_HOST || '127.0.0.1', () => {
    console.log(`📜 Axis form receiver listening on http://${process.env.FORM_HOST || '127.0.0.1'}:${port}/axis-form`);
  });
  return server;
}

module.exports = { startFormServer, createFormServer, parseForm, findFormsChannel };
