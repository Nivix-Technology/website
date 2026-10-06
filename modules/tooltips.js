(function() {
const triggerSelector = [
    '.tooltip-button',
    '.tooltip-support-button',
    '.tooltip-delayed-button',
    '.tooltip-delayed-support-button',
    '.tooltip-support-delayed-button',
].join(', ');
const viewportPadding = 10;
const tooltipGap = 8;
const delayedTooltipWait = 750;
let tooltip = null;
let activeTrigger = null;
let touchFocusedTrigger = null;
let showTimer;
function initTooltips() {
    if (tooltip)
        return;
    tooltip = document.createElement('div');
    tooltip.className = 'tooltip-popup';
    tooltip.id = 'nivix-tooltip-popup';
    tooltip.setAttribute('role', 'tooltip');
    document.body.append(tooltip);
    document.addEventListener('pointerover', handlePointerOver);
    document.addEventListener('pointerout', handlePointerOut);
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);
    document.addEventListener('scroll', repositionTooltip, true);
    window.addEventListener('resize', repositionTooltip);
}
function findTrigger(target) {
    if (!(target instanceof Element))
        return null;
    return target.closest(triggerSelector);
}
function getTooltipContent(trigger) {
    const content = trigger.getAttribute('data-tooltip-content')?.trim();
    if (content)
        return content;
    return trigger.querySelector('.tooltip')?.textContent?.trim() ?? '';
}
function handlePointerOver(event) {
    if (event.pointerType === 'touch')
        return;
    const trigger = findTrigger(event.target);
    if (!trigger || (event.relatedTarget instanceof Node && trigger.contains(event.relatedTarget)))
        return;
    clearTimeout(showTimer);
    if (trigger.classList.contains('tooltip-delayed-button') ||
        trigger.classList.contains('tooltip-delayed-support-button') ||
        trigger.classList.contains('tooltip-support-delayed-button')) {
        hideTooltip();
        activeTrigger = trigger;
        showTimer = setTimeout(() => showTooltip(trigger), delayedTooltipWait);
    }
    else {
        showTooltip(trigger);
    }
}
function handlePointerOut(event) {
    const trigger = findTrigger(event.target);
    if (!trigger || (event.relatedTarget instanceof Node && trigger.contains(event.relatedTarget)))
        return;
    if (trigger === activeTrigger && !trigger.matches(':focus-within'))
        hideTooltip();
}
function handlePointerDown(event) {
    if (event.pointerType === 'touch') {
        touchFocusedTrigger = findTrigger(event.target);
        hideTooltip();
        return;
    }
    touchFocusedTrigger = null;
}
function handleFocusIn(event) {
    const trigger = findTrigger(event.target);
    if (trigger && trigger !== touchFocusedTrigger)
        showTooltip(trigger);
}
function handleFocusOut(event) {
    const trigger = findTrigger(event.target);
    if (!trigger || (event.relatedTarget instanceof Node && trigger.contains(event.relatedTarget)))
        return;
    if (trigger === touchFocusedTrigger)
        touchFocusedTrigger = null;
    if (trigger === activeTrigger && !trigger.matches(':hover'))
        hideTooltip();
}
function showTooltip(trigger) {
    if (!tooltip)
        return;
    clearTimeout(showTimer);
    if (activeTrigger && activeTrigger !== trigger)
        removeDescription(activeTrigger);
    activeTrigger = trigger;
    const content = getTooltipContent(trigger);
    if (!content) {
        hideTooltip();
        return;
    }
    tooltip.textContent = content;
    tooltip.classList.toggle('primary', trigger.querySelector('.tooltip.primary') !== null);
    addDescription(trigger);
    repositionTooltip();
    tooltip.classList.add('is-visible');
}
function hideTooltip() {
    clearTimeout(showTimer);
    if (activeTrigger)
        removeDescription(activeTrigger);
    activeTrigger = null;
    tooltip?.classList.remove('is-visible');
}
function removeDescription(trigger) {
    const descriptions = (trigger.getAttribute('aria-describedby') ?? '')
        .split(/\s+/)
        .filter(id => id && id !== tooltip?.id);
    if (descriptions.length)
        trigger.setAttribute('aria-describedby', descriptions.join(' '));
    else
        trigger.removeAttribute('aria-describedby');
}
function repositionTooltip() {
    if (!tooltip || !activeTrigger || !tooltip.textContent)
        return;
    const triggerRect = activeTrigger.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const preferredSide = activeTrigger.classList.contains('tip-top') ? 'top'
        : activeTrigger.classList.contains('tip-left') ? 'left'
            : activeTrigger.classList.contains('tip-right') ? 'right'
                : 'bottom';
    const sides = [preferredSide, ...['top', 'right', 'bottom', 'left'].filter(side => side !== preferredSide)];
    function positionFor(side) {
        let x = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
        let y = triggerRect.bottom + tooltipGap;
        if (side === 'top')
            y = triggerRect.top - tooltipRect.height - tooltipGap;
        if (side === 'left') {
            x = triggerRect.left - tooltipRect.width - tooltipGap;
            y = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
        }
        if (side === 'right') {
            x = triggerRect.right + tooltipGap;
            y = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
        }
        const fits = x >= viewportPadding && y >= viewportPadding &&
            x + tooltipRect.width <= window.innerWidth - viewportPadding &&
            y + tooltipRect.height <= window.innerHeight - viewportPadding;
        return { x, y, fits };
    }
    const position = sides.map(positionFor).find(candidate => candidate.fits) ?? positionFor(preferredSide);
    const maxX = Math.max(viewportPadding, window.innerWidth - tooltipRect.width - viewportPadding);
    const maxY = Math.max(viewportPadding, window.innerHeight - tooltipRect.height - viewportPadding);
    tooltip.style.left = `${Math.max(viewportPadding, Math.min(position.x, maxX))}px`;
    tooltip.style.top = `${Math.max(viewportPadding, Math.min(position.y, maxY))}px`;
}
function addDescription(trigger) {
    const descriptions = (trigger.getAttribute('aria-describedby') ?? '')
        .split(/\s+/)
        .filter(Boolean);
    if (!descriptions.includes(tooltip.id))
        descriptions.push(tooltip.id);
    trigger.setAttribute('aria-describedby', descriptions.join(' '));
}

window.Nivix = window.Nivix || {};
window.Nivix.tooltips = { initTooltips };
})();
