(function() {
const { init: initCheckboxDependencies } = window.Nivix.nxlib;
const { fillSpaceContainer } = window.Nivix.spaceFillers;
const { initTooltips } = window.Nivix.tooltips;
const tabs = window.Nivix.tabs;
const { showNotification, showPopup } = window.Nivix.notifications;
const { preferences, updatePreference } = window.Nivix.settings;

function initProjectSearch() {
    const searchInput = document.getElementById('project-search');
    const projects = Array.from(document.querySelectorAll('[data-project]'));
    const resultsCount = document.getElementById('results-count');
    const emptyState = document.getElementById('empty-state');

    if (!searchInput || !resultsCount || !emptyState) return;

    function filterProjects() {
        const query = searchInput.value.trim().toLocaleLowerCase();
        let visibleCount = 0;

        projects.forEach((project) => {
            const searchableText = `${project.dataset.search ?? ''} ${project.textContent ?? ''}`
                .toLocaleLowerCase();
            const matches = searchableText.includes(query);
            project.hidden = !matches;
            if (matches) visibleCount++;
        });

        resultsCount.textContent = `${visibleCount} ${visibleCount === 1 ? 'project' : 'projects'}`;
        emptyState.hidden = visibleCount !== 0;
    }

    searchInput.addEventListener('input', filterProjects);
    filterProjects();

    document.addEventListener('keydown', async (event) => {
        const activeElement = document.activeElement;
        if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey ||
            activeElement instanceof HTMLElement &&
            (['INPUT', 'TEXTAREA'].includes(activeElement.tagName) || activeElement.isContentEditable)) {
            return;
        }

        event.preventDefault();
        if (document.getElementById('apps')?.style.display === 'none') {
            await tabs.goto('apps', { display: 'flex' });
        }
        searchInput.focus();
    });
}

function initSettings() {
    const controls = Array.from(document.querySelectorAll('[data-preference]'));
    controls.forEach((control) => {
        const key = control.dataset.preference;
        if (!key || typeof preferences[key] !== 'boolean' || !(control instanceof HTMLInputElement)) {
            console.error('Invalid website preference control.', control);
            return;
        }

        control.checked = preferences[key];
        control.addEventListener('change', () => {
            try {
                updatePreference(key, control.checked);
                const label = control.closest('label')?.querySelector('strong')?.textContent ?? 'Preference';
                showNotification(`${label} saved.`, 'info', 2200, false);
            } catch (error) {
                control.checked = preferences[key];
                console.error(`Failed to save preference "${key}".`, error);
                showNotification('Your preference could not be saved.', 'error');
            }
        });
    });

    const resetButton = document.getElementById('reset-settings');
    resetButton?.addEventListener('click', async () => {
        const confirmed = await showPopup(
            'Reset website preferences',
            'Restore the default background and animation settings?',
            'options'
        );
        if (confirmed !== true) return;

        controls.forEach((control) => {
            const key = control.dataset.preference;
            if (!key || !(control instanceof HTMLInputElement)) return;
            const defaultValue = key === 'transitionAnimations' ||
                key === 'spaceFillerAnimations' || key === 'spaceFillersEnabled';
            control.checked = defaultValue;
            try {
                updatePreference(key, defaultValue);
            } catch (error) {
                control.checked = preferences[key];
                console.error(`Failed to reset preference "${key}".`, error);
                showNotification('Some preferences could not be reset.', 'error');
                return;
            }
        });
        showNotification('Default preferences restored.', 'info', 2200, false);
    });
}

function initTabNavigation() {
    window.addEventListener('tabChange', (event) => {
        const tabId = event.detail?.tabId;
        if (typeof tabId !== 'string') return;

        document.querySelectorAll('[data-tab-navigation]').forEach((button) => {
            const targets = button.dataset.tabNavigation.split(',').map((target) => target.trim());
            const selected = targets.includes(tabId);
            button.classList.toggle('primary', selected);
            if (button.getAttribute('role') === 'tab') {
                button.setAttribute('aria-selected', String(selected));
            }
        });
    });
}

function applyTransitionPreference() {
    document.documentElement.style.setProperty(
        '--transition-speed',
        preferences.transitionAnimations ? '0.2s' : '0s'
    );
}

function init() {
    initTooltips();
    initCheckboxDependencies();
    initSettings();
    initProjectSearch();
    initTabNavigation();
    document.getElementById('copyright-year').textContent = String(new Date().getFullYear());
    window.addEventListener('preferencesUpdate', applyTransitionPreference);
    applyTransitionPreference();
    void fillSpaceContainer();
}

document.addEventListener('DOMContentLoaded', init, { once: true });
})();
