(function() {
const { preferences } = window.Nivix.settings;
function getEBD(id) { return document.getElementById(id); }
function wait(ms) { return new Promise((resolve) => { setTimeout(resolve, ms); }); }
function waitForAnimation(element, animationsEnabled, fallbackMs = 350) {
    if (!animationsEnabled)
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
async function init() {
    fillSpaceContainer();
}
const shapeElementType = 'div';
const baseShapeClass = 'space-filler-shape';
const delay = 25; // Delay between shapes (ms)
let currentCallId = 0;
let lastCombinationIndex = null;
const floatAnimations = ['float', 'float-slow', 'float-fast', 'float-subtle'];
async function fillSpaceContainer() {
    const callId = ++currentCallId;
    const container = getEBD('space-filler-container');
    if (!container)
        return;
    if (!preferences['spaceFillersEnabled']) {
        container.classList.remove('is-fading-out');
        container.style.animationDuration = '';
        container.replaceChildren();
        return;
    }
    const combinations = [
        ["circle1", "polygon4", "circle6", "triangle3", "triangle4", "polygon3", "polygon1", "circle2", "triangle5", "polygon6", "circle7"],
        ["polygon2", "triangle6", "circle5", "polygon1", "circle4", "triangle5", "circle1", "polygon5", "triangle3", "circle7", "triangle1"],
        ["circle3", "triangle1", "triangle7", "polygon6", "circle7", "polygon4", "circle1", "triangle4", "polygon2", "circle5"],
        ["circle6", "polygon4", "triangle3", "polygon1", "circle5", "triangle2", "polygon5", "circle2", "triangle7", "polygon3", "circle7"],
        ["circle1", "polygon2", "triangle6", "triangle4", "polygon5", "circle7", "polygon1", "circle3", "triangle5", "circle5", "polygon3"],
        ["polygon4", "triangle1", "circle3", "triangle2", "polygon3", "circle4", "polygon6", "triangle7", "circle1", "triangle6"],
        ["circle1", "triangle3", "polygon1", "triangle7", "polygon6", "circle2", "polygon2", "circle4", "triangle4", "polygon5", "circle5"],
        ["circle6", "polygon4", "triangle3", "polygon1", "triangle7", "polygon6", "circle7", "circle2", "triangle2", "polygon5", "circle4", "triangle5"],
        ["circle1", "triangle6", "polygon5", "triangle2", "circle7", "polygon3", "circle4", "triangle3", "polygon1", "circle3"],
        ["circle3", "polygon2", "triangle4", "polygon1", "triangle5", "circle2", "circle6", "polygon6", "triangle7", "circle4", "polygon5"]
    ];
    const transitionAnimations = preferences['transitionAnimations'];
    const spaceFillerAnimations = preferences['spaceFillerAnimations'];
    if (container.children.length > 0) {
        if (transitionAnimations) {
            container.classList.remove('is-fading-out');
            void container.offsetWidth;
            container.classList.add('is-fading-out');
            await waitForAnimation(container, transitionAnimations);
        }
    }
    if (callId !== currentCallId)
        return;
    container.classList.remove('is-fading-out');
    container.style.animationDuration = '';
    container.replaceChildren();
    // Pick new combination strictly different from previous
    let randNum;
    do {
        randNum = Math.floor(Math.random() * combinations.length);
    } while (combinations.length > 1 && randNum === lastCombinationIndex);
    lastCombinationIndex = randNum;
    const combination = combinations[randNum];
    for (const shapeClass of combination) {
        if (callId !== currentCallId)
            return;
        const shapeElement = document.createElement(shapeElementType);
        const randomFloatClass = floatAnimations[Math.floor(Math.random() * floatAnimations.length)];
        shapeElement.classList.add(baseShapeClass, shapeClass);
        if (transitionAnimations) {
            if (spaceFillerAnimations) {
                shapeElement.addEventListener('animationend', (event) => {
                    if (event.animationName !== 'fadeInShape')
                        return;
                    shapeElement.classList.remove('is-appearing');
                    shapeElement.classList.add(randomFloatClass, 'is-floating');
                }, { once: true });
            }
            shapeElement.classList.add('is-appearing');
        }
        else if (spaceFillerAnimations) {
            shapeElement.classList.add(randomFloatClass, 'is-floating');
        }
        container.appendChild(shapeElement);
        if (transitionAnimations) {
            await wait(delay);
        }
    }
}
window.addEventListener('tabChange', fillSpaceContainer);
window.addEventListener('preferencesUpdate', (event) => {
    const triggerPreferenceKeys = new Set([
        'spaceFillersEnabled',
        'spaceFillerAnimations'
    ]);
    const eventDetails = event;
    const { preference } = eventDetails.detail;
    if (triggerPreferenceKeys.has(preference)) {
        void fillSpaceContainer();
    }
});

window.Nivix.spaceFillers = { init, fillSpaceContainer };
})();
