(function() {
const { preferences } = window.Nivix.settings;
let navigationHistory = [];
let navigationQueue = Promise.resolve();
document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element))
        return;
    const button = target.closest('button[data-tab-navigation]');
    if (!button)
        return;
    const targetId = (button.dataset['tabNavigation'] ?? '')
        .split(',')
        .map((id) => id.trim())
        .find((id) => id === 'previous' || getEBD(id) !== null);
    if (!targetId)
        return;
    event.preventDefault();
    void goto(targetId, {
        display: button.dataset['tabDisplay'],
        logPrevious: button.dataset['tabLogPrevious'] !== 'false',
    });
});
function getEBD(id) {
    return document.getElementById(id);
}
function focusFirstFocusable(element) {
    const focusableElements = element.querySelectorAll('a[href], button, input, select, textarea, summary, [contenteditable="true"], [tabindex]');
    const firstFocusable = Array.from(focusableElements).find((candidate) => candidate.tabIndex >= 0 &&
        !candidate.hasAttribute('disabled') &&
        candidate.getClientRects().length > 0 &&
        getComputedStyle(candidate).visibility !== 'hidden');
    firstFocusable?.focus();
}
function getPrefix(id) {
    const separatorIndex = id.lastIndexOf('_');
    return separatorIndex === -1 ? null : id.substring(0, separatorIndex);
}
function waitForAnimation(element, instant, fallbackMs = 350) {
    if (instant)
        return Promise.resolve();
    return new Promise((resolve) => {
        let timer;
        const onEnd = (e) => {
            if (e.target === element) {
                cleanup();
                resolve();
            }
        };
        const cleanup = () => {
            element.removeEventListener('animationend', onEnd);
            clearTimeout(timer);
        };
        element.addEventListener('animationend', onEnd);
        // Safety fallback timer so JS promises never hang
        timer = window.setTimeout(() => {
            cleanup();
            resolve();
        }, fallbackMs);
    });
}
async function remove(id, options = {}) {
    const instant = options.instant !== undefined ? options.instant : !preferences['transitionAnimations'];
    const thisElement = getEBD(id);
    if (!thisElement)
        return;
    thisElement.style.animationDuration = instant ? '0s' : '';
    thisElement.classList.remove('is-fading-in', 'is-fading-out');
    void thisElement.offsetWidth;
    thisElement.classList.add('is-fading-out');
    await waitForAnimation(thisElement, instant);
    thisElement.remove();
}
function goto(id, options = {}) {
    const navigation = navigationQueue.then(() => gotoNow(id, options));
    navigationQueue = navigation.catch(() => undefined);
    return navigation;
}
async function gotoNow(id, options = {}) {
    const instant = options.instant !== undefined ? options.instant : !preferences['transitionAnimations'];
    let logPrevious = options.logPrevious !== undefined ? options.logPrevious : true;
    let display = options.display;
    if (id === 'previous') {
        const lastTab = navigationHistory.pop();
        if (!lastTab) {
            console.warn('No previous tab found in history navigation stack.');
            return;
        }
        id = lastTab.id;
        if (display === undefined)
            display = lastTab.display;
        logPrevious = false;
    }
    const targetPrefix = getPrefix(id);
    let tabsHidden = 0;
    let lastHiddenTab;
    const existingTabs = document.querySelectorAll('.tab');
    const hidePromises = [];
    existingTabs.forEach((existingTab) => {
        const existingTabElement = getEBD(existingTab.id);
        if (!existingTabElement)
            return;
        if (getPrefix(existingTab.id) !== targetPrefix)
            return;
        const activeDisplay = existingTabElement.style.display || getComputedStyle(existingTabElement).display;
        if (activeDisplay === 'none')
            return;
        hidePromises.push(hide(existingTab.id, { instant }));
        tabsHidden++;
        lastHiddenTab = { id: existingTab.id, display: activeDisplay };
    });
    if (logPrevious && tabsHidden > 0 && lastHiddenTab) {
        navigationHistory.push(lastHiddenTab);
    }
    // Wait for all active tabs to finish hiding before showing the new one
    await Promise.all(hidePromises);
    await show(id, { instant, display });
}
async function hide(id, options = {}) {
    const thisElement = getEBD(id);
    if (!thisElement)
        return;
    const instant = options.instant !== undefined ? options.instant : !preferences['transitionAnimations'];
    thisElement.style.animationDuration = instant ? '0s' : '';
    thisElement.classList.remove('is-fading-in', 'is-fading-out');
    void thisElement.offsetWidth;
    thisElement.classList.add('is-fading-out');
    await waitForAnimation(thisElement, instant);
    thisElement.style.display = "none";
    thisElement.classList.remove('is-fading-out');
}
async function show(id, options = {}) {
    const thisElement = getEBD(id);
    if (!thisElement)
        return;
    const instant = options.instant !== undefined ? options.instant : !preferences['transitionAnimations'];
    const thisDisplay = options.display ? options.display : "block";
    window.dispatchEvent(new CustomEvent('tabChange', {
        detail: { tabId: id },
    }));
    thisElement.style.display = thisDisplay;
    thisElement.style.animationDuration = instant ? '0s' : '';
    thisElement.classList.remove('is-fading-in', 'is-fading-out');
    void thisElement.offsetWidth;
    thisElement.classList.add('is-fading-in');
    await waitForAnimation(thisElement, instant);
    thisElement.classList.remove('is-fading-in');
    const focus = getPrefix(id) ? false : true;
    if (focus)
        focusFirstFocusable(thisElement);
}

window.Nivix.tabs = { remove, goto, hide, show };
})();
