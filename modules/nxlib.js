(function() {
const dependencyListeners = new WeakMap();
function getCheckboxDependency(dependentCheckbox) {
    const dependency = dependentCheckbox.dataset['depends'] ?? '';
    const separatorIndex = dependency.indexOf(':');
    if (separatorIndex < 1) {
        console.error(`Invalid checkbox data-depends value: "${dependency}". Expected "id:checked" or "id:unchecked".`);
        return null;
    }
    const dependencyId = dependency.slice(0, separatorIndex).trim();
    const expectedValue = dependency.slice(separatorIndex + 1).trim();
    if (!dependencyId || (expectedValue !== 'checked' && expectedValue !== 'unchecked')) {
        console.error(`Invalid checkbox data-depends value: "${dependency}". Expected "id:checked" or "id:unchecked".`);
        return null;
    }
    const source = document.getElementById(dependencyId);
    if (!(source instanceof HTMLInputElement) || source.type !== 'checkbox') {
        console.error(`Checkbox dependency "${dependencyId}" does not reference a checkbox element.`);
        return null;
    }
    return { source, expectedValue };
}
function init() {
    const dependentCheckboxes = document.querySelectorAll('input[type="checkbox"][data-depends]');
    dependentCheckboxes.forEach((dependentCheckbox) => {
        const dependency = getCheckboxDependency(dependentCheckbox);
        const existingListener = dependencyListeners.get(dependentCheckbox);
        if (!dependency) {
            if (existingListener) {
                existingListener.source.removeEventListener('change', existingListener.handler);
                dependencyListeners.delete(dependentCheckbox);
            }
            return;
        }
        if (existingListener?.source === dependency.source &&
            existingListener.expectedValue === dependency.expectedValue) {
            const shouldBeChecked = dependency.expectedValue === 'checked';
            dependentCheckbox.disabled = dependency.source.checked !== shouldBeChecked;
            return;
        }
        if (existingListener) {
            existingListener.source.removeEventListener('change', existingListener.handler);
        }
        const updateState = () => {
            const shouldBeChecked = dependency.expectedValue === 'checked';
            dependentCheckbox.disabled = dependency.source.checked !== shouldBeChecked;
        };
        dependency.source.addEventListener('change', updateState);
        dependencyListeners.set(dependentCheckbox, {
            ...dependency,
            handler: updateState,
        });
        updateState();
    });
}

window.Nivix = window.Nivix || {};
window.Nivix.nxlib = { init };
})();
