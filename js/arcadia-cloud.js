/**
 * Arcadia Cloud — shared Firebase layer
 * ------------------------------------------------------------------
 * Loaded by the homepage AND by every individual game (via a relative
 * path). Provides one small global, `window.Arcadia`, with:
 *
 *   Arcadia.onAuthChange(cb)          — cb(userOrNull) on login/logout
 *   Arcadia.getCurrentUser()          — current Firebase user or null
 *   Arcadia.signUp(email, pw, name)   — create account -> Promise
 *   Arcadia.signIn(email, pw)         — log in -> Promise
 *   Arcadia.signOutUser()             — log out -> Promise
 *   Arcadia.submitScore(slug, title, score) — record a game result
 *   Arcadia.getGlobalLeaderboard(n)   — top N players site-wide
 *   Arcadia.isConfigured              — false until firebase-config.js
 *                                        has real (non-placeholder) keys
 *
 * Requires (loaded before this file):
 *   - firebase-app-compat.js, firebase-auth-compat.js,
 *     firebase-firestore-compat.js  (Firebase SDK, compat build)
 *   - firebase-config.js  (defines ARCADIA_FIREBASE_CONFIG)
 *
 * Designed to fail soft: if Firebase isn't configured yet, or a
 * network/permission error happens, every method resolves harmlessly
 * instead of throwing, so the rest of the site/game keeps working.
 * ------------------------------------------------------------------
 */
(function () {
  "use strict";

  function isPlaceholderConfig(cfg) {
    return !cfg || !cfg.apiKey || /YOUR_/.test(cfg.apiKey);
  }

  var configured = false;
  var auth = null;
  var db = null;

  try {
    if (
      typeof firebase !== "undefined" &&
      typeof ARCADIA_FIREBASE_CONFIG !== "undefined" &&
      !isPlaceholderConfig(ARCADIA_FIREBASE_CONFIG)
    ) {
      var app = firebase.apps && firebase.apps.length
        ? firebase.apps[0]
        : firebase.initializeApp(ARCADIA_FIREBASE_CONFIG);
      auth = firebase.auth(app);
      db = firebase.firestore(app);
      configured = true;
    } else {
      console.warn(
        "[Arcadia] Firebase isn't configured yet — login and the cloud " +
        "leaderboard are disabled. Fill in js/firebase-config.js to enable them."
      );
    }
  } catch (err) {
    console.warn("[Arcadia] Firebase failed to initialize:", err);
  }

  function friendlyName(user) {
    if (!user) return "Player";
    return user.displayName || (user.email ? user.email.split("@")[0] : "Player");
  }

  function onAuthChange(cb) {
    if (!configured) {
      cb(null);
      return function unsubscribe() {};
    }
    return auth.onAuthStateChanged(cb);
  }

  function getCurrentUser() {
    return configured ? auth.currentUser : null;
  }

  function signUp(email, password, displayName) {
    if (!configured) return Promise.reject(new Error("Cloud features aren't set up yet."));
    return auth.createUserWithEmailAndPassword(email, password).then(function (cred) {
      return cred.user.updateProfile({ displayName: displayName }).then(function () {
        return db.collection("users").doc(cred.user.uid).set({
          displayName: displayName,
          email: email,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }).then(function () {
        return cred.user;
      });
    });
  }

  function signIn(email, password) {
    if (!configured) return Promise.reject(new Error("Cloud features aren't set up yet."));
    return auth.signInWithEmailAndPassword(email, password).then(function (cred) {
      return cred.user;
    });
  }

  function signOutUser() {
    if (!configured) return Promise.resolve();
    return auth.signOut();
  }

  function submitScore(slug, title, score) {
    // Phase 3A: Record progression event safely for both guests and authenticated users
    try {
      if (window.ArcadiaProgression && typeof window.ArcadiaProgression.recordScoreEvent === "function") {
        window.ArcadiaProgression.recordScoreEvent(slug, title, score);
      }
    } catch (progErr) {
      console.warn("[Arcadia] Progression record failed:", progErr);
    }

    if (!configured) return Promise.resolve({ skipped: true, reason: "not-configured" });
    var user = auth.currentUser;
    if (!user) return Promise.resolve({ skipped: true, reason: "not-signed-in" });
    if (typeof score !== "number" || !isFinite(score) || score <= 0) {
      return Promise.resolve({ skipped: true, reason: "invalid-score" });
    }

    var displayName = friendlyName(user);
    var perGameRef = db.collection("scores").doc(user.uid + "_" + slug);
    var topRef = db.collection("leaderboard").doc(user.uid);
    var stamp = firebase.firestore.FieldValue.serverTimestamp();

    return perGameRef.get().then(function (perGameSnap) {
      var prevGameScore = perGameSnap.exists ? (perGameSnap.data().score || 0) : 0;
      var writes = [];
      if (score > prevGameScore) {
        writes.push(perGameRef.set({
          uid: user.uid,
          displayName: displayName,
          gameSlug: slug,
          gameTitle: title,
          score: score,
          updatedAt: stamp
        }));
      }
      return Promise.all(writes);
    }).then(function () {
      return topRef.get();
    }).then(function (topSnap) {
      var prevTop = topSnap.exists ? (topSnap.data().score || 0) : 0;
      if (score > prevTop) {
        return topRef.set({
          uid: user.uid,
          displayName: displayName,
          gameSlug: slug,
          gameTitle: title,
          score: score,
          updatedAt: stamp
        }).then(function () {
          return { skipped: false, newRecord: true };
        });
      }
      return { skipped: false, newRecord: false };
    }).catch(function (err) {
      console.warn("[Arcadia] submitScore failed:", err);
      return { skipped: true, reason: "error", error: err };
    });
  }

  function getGlobalLeaderboard(n) {
    n = n || 10;
    if (!configured) return Promise.resolve([]);
    return db.collection("leaderboard").orderBy("score", "desc").limit(n).get()
      .then(function (snap) {
        return snap.docs.map(function (d) { return d.data(); });
      })
      .catch(function (err) {
        console.warn("[Arcadia] getGlobalLeaderboard failed:", err);
        return [];
      });
  }

  function getGameLeaderboard(slug, n) {
    n = n || 10;
    if (!configured) {
      return Promise.resolve({ success: false, reason: "not-configured", rows: [] });
    }
    return db.collection("scores")
      .where("gameSlug", "==", slug)
      .orderBy("score", "desc")
      .limit(n)
      .get()
      .then(function (snap) {
        var rows = snap.docs.map(function (d) { return d.data(); });
        return {
          success: true,
          rows: rows
        };
      })
      .catch(function (err) {
        console.warn("[Arcadia] getGameLeaderboard failed for " + slug + ":", err);
        var isIndexError = err && err.message && err.message.indexOf("requires an index") !== -1;
        return {
          success: false,
          reason: isIndexError ? "index-required" : "error",
          error: err,
          rows: []
        };
      });
  }

  function getCloudProgression(uid) {
    if (!configured || !uid) return Promise.resolve(null);
    return db.collection("progression").doc(uid).get()
      .then(function (snap) {
        return snap.exists ? snap.data() : null;
      })
      .catch(function (err) {
        console.warn("[Arcadia] getCloudProgression failed:", err);
        return null;
      });
  }

  function saveCloudProgression(uid, data) {
    if (!configured || !uid || !data) {
      return Promise.resolve({ success: false, reason: "not-configured" });
    }
    var stamp = firebase.firestore.FieldValue.serverTimestamp();
    var payload = {
      uid: uid,
      xp: (typeof data.xp === "number" && isFinite(data.xp) && data.xp >= 0) ? Math.floor(data.xp) : 0,
      level: (typeof data.level === "number" && isFinite(data.level) && data.level >= 1) ? Math.min(100, Math.floor(data.level)) : 1,
      rankTitle: typeof data.rankTitle === "string" ? data.rankTitle : "Rookie",
      badgeTier: typeof data.badgeTier === "string" ? data.badgeTier : "bronze",
      achievements: Array.isArray(data.achievements) ? data.achievements.slice(0, 18) : [],
      stats: (data.stats && typeof data.stats === "object") ? {
        sessionsPlayed: typeof data.stats.sessionsPlayed === "number" ? Math.max(0, Math.floor(data.stats.sessionsPlayed)) : 0,
        lastPlayed: typeof data.stats.lastPlayed === "string" ? data.stats.lastPlayed : new Date().toISOString(),
        favoriteGame: typeof data.stats.favoriteGame === "string" ? data.stats.favoriteGame : null,
        gamesPlayedCount: (data.stats.gamesPlayedCount && typeof data.stats.gamesPlayedCount === "object") ? data.stats.gamesPlayedCount : {}
      } : {
        sessionsPlayed: 0,
        lastPlayed: new Date().toISOString(),
        favoriteGame: null,
        gamesPlayedCount: {}
      },
      daily: (data.daily && typeof data.daily === "object") ? {
        date: typeof data.daily.date === "string" ? data.daily.date : new Date().toISOString().slice(0, 10),
        xp: typeof data.daily.xp === "number" ? Math.max(0, Math.floor(data.daily.xp)) : 0
      } : {
        date: new Date().toISOString().slice(0, 10),
        xp: 0
      },
      updatedAt: stamp
    };
    return db.collection("progression").doc(uid).set(payload, { merge: true })
      .then(function () {
        return { success: true };
      })
      .catch(function (err) {
        console.warn("[Arcadia] saveCloudProgression failed:", err);
        return { success: false, error: err };
      });
  }

  // Auto-load arcadia-progression.js in browser context if not already loaded
  if (typeof window !== "undefined" && !window.ArcadiaProgression && typeof document !== "undefined") {
    try {
      var scripts = document.getElementsByTagName("script");
      var currentScript = document.currentScript;
      var progSrc = "js/arcadia-progression.js";
      if (currentScript && currentScript.src) {
        progSrc = currentScript.src.replace(/arcadia-cloud\.js(\?.*)?$/, "arcadia-progression.js$1");
      } else {
        for (var i = 0; i < scripts.length; i++) {
          if (scripts[i].src && scripts[i].src.indexOf("arcadia-cloud.js") !== -1) {
            progSrc = scripts[i].src.replace(/arcadia-cloud\.js(\?.*)?$/, "arcadia-progression.js$1");
            break;
          }
        }
      }
      var s = document.createElement("script");
      s.src = progSrc;
      s.async = false;
      document.head.appendChild(s);
    } catch (e) {
      // Sandboxed or headless environments can ignore
    }
  }

  // Auto-load arcadia-sync.js in browser context if not already loaded
  if (typeof window !== "undefined" && !window.ArcadiaSync && typeof document !== "undefined") {
    try {
      var scriptsSync = document.getElementsByTagName("script");
      var currentScriptSync = document.currentScript;
      var syncSrc = "js/arcadia-sync.js";
      if (currentScriptSync && currentScriptSync.src) {
        syncSrc = currentScriptSync.src.replace(/arcadia-cloud\.js(\?.*)?$/, "arcadia-sync.js$1");
      } else {
        for (var j = 0; j < scriptsSync.length; j++) {
          if (scriptsSync[j].src && scriptsSync[j].src.indexOf("arcadia-cloud.js") !== -1) {
            syncSrc = scriptsSync[j].src.replace(/arcadia-cloud\.js(\?.*)?$/, "arcadia-sync.js$1");
            break;
          }
        }
      }
      var sSync = document.createElement("script");
      sSync.src = syncSrc;
      sSync.async = false;
      document.head.appendChild(sSync);
    } catch (eSync) {
      // Sandboxed or headless environments can ignore
    }
  }

  window.Arcadia = {
    isConfigured: configured,
    onAuthChange: onAuthChange,
    getCurrentUser: getCurrentUser,
    signUp: signUp,
    signIn: signIn,
    signOutUser: signOutUser,
    submitScore: submitScore,
    getGlobalLeaderboard: getGlobalLeaderboard,
    getGameLeaderboard: getGameLeaderboard,
    getCloudProgression: getCloudProgression,
    saveCloudProgression: saveCloudProgression,
    get progression() {
      return window.ArcadiaProgression || null;
    },
    set progression(val) {
      if (val && typeof window !== "undefined") {
        window.ArcadiaProgression = val;
      }
    },
    get sync() {
      return window.ArcadiaSync || null;
    },
    set sync(val) {
      if (val && typeof window !== "undefined") {
        window.ArcadiaSync = val;
      }
    }
  };
})();
