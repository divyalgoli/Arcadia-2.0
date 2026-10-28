# Setting up login + the global leaderboard

Arcadia's login system and cross-game leaderboard run on a free Firebase
project (Authentication + Firestore). Nothing else on the site needs a
backend — only these two features. Until you complete this setup, the
site works exactly as before: the Log In button shows a "not set up yet"
message and the Leaderboard panel shows a friendly placeholder.

## 1. Create a Firebase project

1. Go to <https://console.firebase.google.com> and click **Add project**.
2. Name it anything (e.g. "arcadia"). Google Analytics is optional — you
   can skip it.
3. This all fits comfortably in Firebase's free **Spark** plan.

## 2. Turn on Email/Password sign-in

1. In the left sidebar: **Build → Authentication → Get started**.
2. Under **Sign-in method**, enable **Email/Password**.

## 3. Create the Firestore database

1. In the left sidebar: **Build → Firestore Database → Create database**.
2. Choose **Start in production mode** (the rules below lock it down
   properly — don't leave it in test mode long-term).
3. Pick any region close to your players.

## 4. Paste in the security rules

In Firestore, go to the **Rules** tab and replace the contents with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // One doc per user with their basic profile info.
    match /users/{uid} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == uid;
    }

    // One doc per (user, game) — that user's best score in that game.
    match /scores/{docId} {
      allow read: if true;
      allow write: if request.auth != null
        && docId == request.auth.uid + '_' + request.resource.data.gameSlug
        && request.resource.data.uid == request.auth.uid
        && request.resource.data.score is number
        && request.resource.data.score > 0;
    }

    // One doc per user — their single best score across ALL games.
    // This is what powers the homepage Leaderboard panel.
    match /leaderboard/{uid} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == uid
        && request.resource.data.uid == request.auth.uid
        && request.resource.data.score is number
        && request.resource.data.score > 0;
    }
  }
}
```

Click **Publish**.

## 5. Register a web app and copy your config

1. Click the gear icon → **Project settings**.
2. Under **Your apps**, click the **</>** (web) icon to register a new app.
3. Give it any nickname — you don't need Firebase Hosting.
4. Firebase shows you a `firebaseConfig` object. Copy the values into
   **`js/firebase-config.js`** in this project, replacing the
   `YOUR_...` placeholders. That one file is shared by the homepage and
   every game (each game loads it via a relative path), so this is the
   only place you need to edit.

## 6. Test it

Serve the site locally (`python3 -m http.server 8000` from the
`GameHub/` folder) and open it in a browser:

- Click **Log In** in the navbar → switch to the **Sign Up** tab →
  create an account.
- Play any game to a finished result (a win, game over, etc.).
- Go back to the homepage and scroll to **Leaderboard** — your score
  should appear, tagged with the game you set it in.

## How it works, briefly

- `js/firebase-config.js` — your project's keys (the only file you edit).
- `js/arcadia-cloud.js` — shared by the homepage and every game; wraps
  Firebase Auth + Firestore into a small `window.Arcadia` API
  (`signUp`, `signIn`, `signOutUser`, `submitScore`, `getGlobalLeaderboard`).
  If the config still has placeholder values, every method fails
  harmlessly so the rest of the site keeps working.
- `js/auth-ui.js` — the homepage's login/sign-up modal, wired to
  `window.Arcadia`.
- Each game calls `Arcadia.submitScore(slug, title, score)` at the
  moment it already saves a high score locally (only if someone's
  signed in — guests just play normally without appearing on the
  leaderboard). It's stored in two places: a per-game best (`scores`
  collection, for potential future per-game leaderboards) and, only if
  it beats the player's current best across *any* game, their overall
  best (`leaderboard` collection) — that's what the homepage panel
  reads.

## Adding login to a new game later

If you add a 7th game, add this before its `</body>` (relative paths
assume the game lives at `games/<slug>/...`, two folders deep):

```html
<script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js"></script>
<script src="../../js/firebase-config.js"></script>
<script src="../../js/arcadia-cloud.js"></script>
```

Then, wherever the game already saves a high score, add:

```js
if (window.Arcadia) Arcadia.submitScore('your-game-slug', 'Your Game Title', score);
```
