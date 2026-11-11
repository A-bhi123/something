# Website

React + TypeScript + Vite, animated with [Motion](https://motion.dev/docs/react).

## First-time setup (password)

The site opens only with the password you set in the backend.

1. Copy `server/.env.example` to `server/.env`.
2. Fill in `APP_PASSWORD` (the password visitors type) and `SESSION_SECRET`
   (a random string of 32+ characters). Generate one with:
   `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
3. To change the password later, edit `server/.env` and restart the server.

`server/.env` is git-ignored. Never share it or paste the password into frontend code.

## Run

```bash
npm install
npm run dev        # starts the website (port 5173) and the backend (port 3001) together
npm run build      # type-check + production build
npm start          # production: one server on port 3001 serves the website and the API
```

## Login behaviour

- The password is checked only on the server (`POST /api/auth/login`). A correct password sets a signed,
  HttpOnly cookie that expires after `SESSION_HOURS` (default 12).
- After 5 wrong attempts an IP address is blocked for 15 minutes.
- Set `COOKIE_SECURE=true` and `TRUST_PROXY` (usually `1`) when deploying behind HTTPS.
- Known limit: the website's JavaScript files are still downloadable by anyone who knows their URL.
  The password protects the site's screens, not the raw files. Do not put secrets in the frontend code.

## Structure

```
server/           Backend (Node + Express)
  src/config.js     Reads and validates server/.env
  src/routes/       HTTP routes (auth)
  src/services/     Password check and session tokens
  src/middleware/   Wrong-password lockout
scripts/dev.mjs   Starts frontend and backend together
src/
  app/            App shell (providers + scenes)
  features/auth/  AuthGate (locks the site) and authApi (talks to the backend)
  scenes/         One folder per scene/section: <Name>Scene.tsx + <Name>Scene.css
  components/
    layout/       Header, footer, page wrappers
    ui/           Buttons, cards and other reusable pieces
  animation/      Everything reusable about motion
    transitions.ts  Easings, durations, spring presets
    variants.ts     fadeIn, slideUp, scaleIn, staggerContainer
    MotionProvider  Respects the visitor's "reduce motion" setting
    components/     Reveal and other animation wrappers
    hooks/          Custom animation hooks
  assets/
    shared/         icons/ images/ fonts/  (used by many scenes)
    scenes/<scene>/ images/ video/ audio/ models/  (used by one scene)
  config/         Site-wide values (site.ts)
  styles/         tokens.css (colours, type, spacing), base.css
  hooks/ lib/ types/   Shared hooks, helpers, TypeScript types
public/           Files served as-is (favicon, robots.txt)
```

## Conventions

- Import from `@/...` (maps to `src/`), e.g. `import { slideUp } from "@/animation"`.
- Motion imports come from `"motion/react"`.
- New scene: create `src/scenes/<name>/` and `src/assets/scenes/<name>/{images,video,audio,models}`.
- Colours, fonts and spacing live in `src/styles/tokens.css`. They are neutral placeholders until the design direction is decided.
- `LoginScene` is the password screen: an animated pastel scene with the password card on top.
  After a correct password the card fades, the scene melts into the cartoon door picture
  (`assets/scenes/login/images/entry-door.jpg`, built in `EntryDoor.tsx`), the camera drifts up to the door,
  the door unlocks and swings open, and warm light floods the screen before the site appears (`AuthGate` tracks
  this as `GatePhase`). To use another picture, replace the image and update the door outline in `EntryDoor.tsx`/`.css`.
- `HomeScene` is the first scene behind the gate: flowers rain for 6 seconds, then the host speaks the lines in
  `src/scenes/home/script.ts` (typewriter text, talking mouth, wave, smile). Edit that file to change the words.
  The "Yes, I'm ready" button currently only fires a small flower burst; the next scene will be connected there.
- `useDialogue` (in `animation/hooks`) plays any script of `say` / `pause` beats; `FlowerRain` and `Flower` are reusable.
- To use your own character instead of the SVG host, replace `Character.tsx` (keep the `speaking`, `mood`, `wave` props).
