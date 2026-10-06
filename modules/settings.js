(function() {
const defaultPreferences = {
    transitionAnimations: true,
    spaceFillerAnimations: true,
    spaceFillersEnabled: true
};

function loadPreferences() {
    try {
        const saved = localStorage.getItem('nivix_preferences');
        if (!saved) return { ...defaultPreferences };

        const parsed = JSON.parse(saved);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            throw new TypeError('Saved preferences must be an object.');
        }

        return Object.fromEntries(
            Object.entries(defaultPreferences).map(([key, fallback]) => [
                key,
                typeof parsed[key] === typeof fallback ? parsed[key] : fallback
            ])
        );
    } catch (error) {
        console.error('Failed to load Nivix preferences; using defaults.', error);
        return { ...defaultPreferences };
    }
}

const preferences = loadPreferences();

function updatePreference(key, value) {
    if (!Object.hasOwn(defaultPreferences, key)) {
        throw new Error(`Unknown preference: ${key}`);
    }
    if (typeof value !== typeof defaultPreferences[key]) {
        throw new TypeError(`Preference "${key}" must be a ${typeof defaultPreferences[key]}.`);
    }

    const previousValue = preferences[key];
    preferences[key] = value;
    try {
        localStorage.setItem('nivix_preferences', JSON.stringify(preferences));
    } catch (error) {
        preferences[key] = previousValue;
        throw error;
    }

    window.dispatchEvent(new CustomEvent('preferencesUpdate', {
        detail: { preference: key, value }
    }));
}

window.Nivix = window.Nivix || {};
window.Nivix.settings = { preferences, updatePreference };
})();
