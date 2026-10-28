// settings.js — reads/writes user preferences (sound, music)
const CandySettings = (() => {
  let current = CandyStorage.getSettings();

  function get() {
    return current;
  }

  function update(partial) {
    current = { ...current, ...partial };
    CandyStorage.setSettings(current);
    return current;
  }

  function bindToggle(elId, key) {
    const el = document.getElementById(elId);
    if (!el) return;
    el.checked = !!current[key];
    el.addEventListener('change', () => update({ [key]: el.checked }));
  }

  return { get, update, bindToggle };
})();
