/**
 * GameHub — localStorage helpers
 * Handles favorites, recently-played tracking and theme persistence.
 * Wrapped in try/catch throughout so the site still works if storage
 * is unavailable (private browsing, disabled cookies, etc.).
 */
const GHStorage = (function () {
  const KEYS = {
    favorites: "gamehub_favorites",
    recent: "gamehub_recent",
    theme: "gamehub_theme"
  };

  function safeGet(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function safeSet(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }

  return {
    getFavorites() {
      return safeGet(KEYS.favorites, []);
    },
    isFavorite(slug) {
      return this.getFavorites().includes(slug);
    },
    toggleFavorite(slug) {
      let favs = this.getFavorites();
      if (favs.includes(slug)) {
        favs = favs.filter((s) => s !== slug);
      } else {
        favs.push(slug);
      }
      safeSet(KEYS.favorites, favs);
      return favs.includes(slug);
    },
    getRecent(limit) {
      const list = safeGet(KEYS.recent, []);
      list.sort((a, b) => b.ts - a.ts);
      return typeof limit === "number" ? list.slice(0, limit) : list;
    },
    recordPlay(slug) {
      let list = safeGet(KEYS.recent, []);
      list = list.filter((g) => g.slug !== slug);
      list.unshift({ slug, ts: Date.now() });
      list = list.slice(0, 8);
      safeSet(KEYS.recent, list);
    },
    getTheme() {
      return safeGet(KEYS.theme, "dark");
    },
    setTheme(theme) {
      safeSet(KEYS.theme, theme);
    }
  };
})();
