# AquaBot

## Axis Cult forms

When someone signs the Axis Cult membership form on the portfolio site, AquaBot posts the signed
sheet to the server's **#forms** channel as an embed with their answers and the sheet image.

The bot runs a small web endpoint, `POST /axis-form`, on port 8787. It only listens on localhost,
so it is reached from the internet through a tunnel (below), not an open port. It:

- only accepts forms from the portfolio site's origin (`FORM_ORIGINS`);
- allows **one pledge per person**: a second form from the same IP, the same browser or the same
  contact details gets a "You have already pledged" reply. Who has pledged is kept as salted
  hashes in `data/axisForms.json`, never as raw IPs or contact details;
- limits each visitor to 3 attempts per 10 minutes, caps the image at 1.5 MB and checks it is a
  real JPEG or PNG;
- posts with mentions disabled, so a name like `@everyone` can't ping anyone.

### Setup

1. Pick the channel for forms. Give AquaBot **View Channel, Send Messages, Embed Links and Attach
   Files** there. Forms go to, in order:
   - the channel an admin chose with **`/formschannel set #channel`** (needs Manage Server;
     `/formschannel show` and `/formschannel reset` too). It is saved in `data/settings.json`;
   - `FORMS_CHANNEL_ID` from `.env`;
   - a text channel named `forms`.
2. Add to `.env` (see `.env.example`):

   ```sh
   FORM_PORT=8787
   FORM_ORIGINS=https://kimochidesu.github.io
   FORM_SALT=any-random-text
   ```

3. `git pull`, run `npm run deploy` once so Discord learns the new `/formschannel` command, and
   restart the bot. The log shows
   `Axis form receiver listening on http://127.0.0.1:8787/axis-form`.
   Check it with `curl http://127.0.0.1:8787/health`.
4. Give it a public HTTPS address with a tunnel. Either works without opening router ports:

   - **Tailscale Funnel** (stable URL, no domain needed):

     ```sh
     curl -fsSL https://tailscale.com/install.sh | sh
     sudo tailscale up
     sudo tailscale funnel --bg 8787
     ```

     The URL is `https://<machine-name>.<tailnet>.ts.net`.
   - **Cloudflare quick tunnel** (good for testing; the URL changes every time it restarts):

     ```sh
     cloudflared tunnel --url http://localhost:8787
     ```

5. Put the full endpoint, e.g. `https://<machine-name>.<tailnet>.ts.net/axis-form`, into
   `FORMS_ENDPOINT` in the portfolio site's `index.html`. Until that is set, the site skips this
   step and only saves the sheet in the visitor's browser.
