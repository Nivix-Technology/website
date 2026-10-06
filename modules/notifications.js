(function() {
const { preferences } = window.Nivix.settings;
const queue = [];
let isProcessing = false;
function showNotification(message, type = "info", duration = 3000, sticky = type === "error") {
    queue.push({ message, type, duration, sticky });
    if (!isProcessing) {
        processQueue();
    }
}
async function processQueue() {
    if (queue.length === 0) {
        isProcessing = false;
        return;
    }
    isProcessing = true;
    const current = queue.shift();
    await renderNotification(current);
    processQueue();
}
function renderNotification(item) {
    return new Promise((resolve) => {
        const container = document.createElement("div");
        container.className = `notification-box ${item.type}`;
        container.setAttribute("role", "status");
        container.setAttribute("aria-live", "polite");
        const header = document.createElement("div");
        header.className = "notification-header";
        const title = document.createElement("span");
        title.className = "notification-title";
        title.textContent = `${item.type[0].toUpperCase()}${item.type.slice(1)}`;
        const messageOutput = document.createElement("p");
        messageOutput.className = "notification-message";
        messageOutput.textContent = item.message;
        const closeBtn = document.createElement("button");
        closeBtn.className = "notification-close";
        closeBtn.setAttribute("aria-label", "Dismiss notification");
        closeBtn.innerHTML = "&times;";
        header.appendChild(title);
        header.appendChild(closeBtn);
        container.appendChild(header);
        container.appendChild(messageOutput);
        if (preferences['transitionAnimations'])
            container.style.animation = "nivixFadeIn 0.3s var(--transition-easing-style) forwards";
        document.body.appendChild(container);
        let dismissTimer = null;
        let isDismissed = false;
        const dismiss = () => {
            if (isDismissed)
                return;
            isDismissed = true;
            if (dismissTimer !== null) {
                clearTimeout(dismissTimer);
            }
            if (!preferences['transitionAnimations']) {
                container.remove();
                resolve();
                return;
            }
            container.style.animation = "nivixFadeOut 0.25s var(--transition-easing-style) forwards";
            container.addEventListener("animationend", () => {
                container.remove();
                resolve();
            }, { once: true });
        };
        closeBtn.addEventListener("click", dismiss);
        if (!item.sticky) {
            dismissTimer = window.setTimeout(dismiss, item.duration);
        }
    });
}
const popupMargin = 5;
let cursorX = null;
let cursorY = null;
let dismissActivePopup = null;
document.addEventListener("mousemove", (event) => {
    cursorX = event.clientX;
    cursorY = event.clientY;
});
function placePopup(container, popup, anchor) {
    popup.style.position = "fixed";
    popup.style.left = "0px";
    popup.style.top = "0px";
    const style = getComputedStyle(popup);
    const width = parseFloat(style.width);
    const height = parseFloat(style.height);
    const minX = popupMargin;
    const minY = popupMargin;
    const maxX = window.innerWidth - width - popupMargin;
    const maxY = window.innerHeight - height - popupMargin;
    if (![width, height, maxX, maxY].every(Number.isFinite) || maxX < minX || maxY < minY) {
        container.classList.add("center", "popup-container-shaded");
        popup.style.position = "";
        popup.style.left = "";
        popup.style.top = "";
        return;
    }
    const triggerRect = anchor?.getBoundingClientRect();
    const triggerX = triggerRect
        ? triggerRect.left + triggerRect.width / 2
        : cursorX;
    const triggerY = triggerRect?.bottom ?? cursorY;
    if (triggerX === null || triggerY === null) {
        container.classList.add("center", "popup-container-shaded");
        popup.style.position = "";
        popup.style.left = "";
        popup.style.top = "";
        return;
    }
    popup.style.left = `${triggerX - width / 2}px`;
    popup.style.top = `${triggerY + popupMargin}px`;
    const positionedStyle = getComputedStyle(popup);
    const x = parseFloat(positionedStyle.left);
    const y = parseFloat(positionedStyle.top);
    if (![x, y].every(Number.isFinite)) {
        container.classList.add("center", "popup-container-shaded");
        popup.style.position = "";
        popup.style.left = "";
        popup.style.top = "";
        return;
    }
    const clampX = (x) => Math.max(minX, Math.min(x, maxX));
    const clampY = (y) => Math.max(minY, Math.min(y, maxY));
    const belowTrigger = { x, y };
    const aboveTrigger = triggerRect
        ? { x: triggerX - width / 2, y: triggerRect.top - height - popupMargin }
        : null;
    const candidates = [
        belowTrigger,
        ...(aboveTrigger ? [aboveTrigger] : []),
        ...(triggerRect ? [
            { x: triggerRect.right + popupMargin, y: triggerRect.top + (triggerRect.height - height) / 2 },
            { x: triggerRect.left - width - popupMargin, y: triggerRect.top + (triggerRect.height - height) / 2 }
        ] : [])
    ];
    const fallback = triggerRect && triggerRect.top > window.innerHeight / 2 && aboveTrigger
        ? aboveTrigger
        : belowTrigger;
    const placement = candidates.find(({ x, y }) => x >= minX && x <= maxX && y >= minY && y <= maxY) ?? {
        x: clampX(fallback.x),
        y: clampY(fallback.y)
    };
    popup.style.left = `${placement.x}px`;
    popup.style.top = `${placement.y}px`;
}
function showPopup(title, message, type = "options", options = [
    { content: "No", value: false, highlighted: false },
    { content: "Yes", value: true, highlighted: true }
], inputProps = {}) {
    const activeElement = document.activeElement;
    const anchor = activeElement instanceof HTMLElement
        ? activeElement.closest("button")
        : null;
    dismissActivePopup?.();
    return new Promise((resolve) => {
        const popupContainer = document.createElement("div");
        popupContainer.className = "popup-container";
        const popup = document.createElement("div");
        popup.className = "popup";
        const titleBar = document.createElement("div");
        titleBar.className = "popup-title-bar";
        const titleOutput = document.createElement("span");
        titleOutput.className = "popup-title";
        titleOutput.textContent = title;
        titleBar.appendChild(titleOutput);
        const messageContainer = document.createElement("div");
        messageContainer.className = "message-container";
        const span = document.createElement("span");
        span.innerHTML = message;
        messageContainer.appendChild(span);
        let inputElement = null;
        // If type is not "options", generate the requested input field
        if (type !== "options") {
            inputElement = document.createElement("input");
            inputElement.type = type;
            inputElement.className = "nivix-input";
            // Apply all passed attributes dynamically
            Object.entries(inputProps).forEach(([key, val]) => {
                if (val !== undefined && val !== null) {
                    inputElement.setAttribute(key, String(val));
                }
            });
            messageContainer.appendChild(inputElement);
        }
        const actionContainer = document.createElement("div");
        actionContainer.className = "action-container";
        let highlightedButton = null;
        const transitionAnimations = preferences['transitionAnimations'];
        let isClosing = false;
        let outsidePointerDown = null;
        let trapTabNavigation = null;
        let dismissThisPopup = null;
        const clearActivePopup = () => {
            if (dismissActivePopup === dismissThisPopup) {
                dismissActivePopup = null;
            }
        };
        const removeOutsideListener = () => {
            if (outsidePointerDown) {
                document.removeEventListener("pointerdown", outsidePointerDown);
                outsidePointerDown = null;
            }
            if (trapTabNavigation) {
                document.removeEventListener("keydown", trapTabNavigation);
                trapTabNavigation = null;
            }
        };
        const closePopup = (selectedValue, immediately = false) => {
            if (immediately) {
                isClosing = true;
                removeOutsideListener();
                popupContainer.remove();
                clearActivePopup();
                resolve(undefined);
                return;
            }
            if (isClosing)
                return;
            isClosing = true;
            removeOutsideListener();
            if (!transitionAnimations) {
                popupContainer.remove();
                clearActivePopup();
                resolve(selectedValue);
                return;
            }
            const isShaded = popupContainer.classList.contains("popup-container-shaded");
            const finishClose = () => {
                popupContainer.remove();
                clearActivePopup();
                resolve(selectedValue);
            };
            let pendingAnimations = isShaded ? 2 : 1;
            const animationEnded = () => {
                pendingAnimations -= 1;
                if (pendingAnimations === 0)
                    finishClose();
            };
            popup.addEventListener("animationend", () => {
                animationEnded();
            }, { once: true });
            popup.style.animation = "nivixFadeOut 0.3s var(--transition-easing-style) forwards";
            if (isShaded) {
                const onContainerAnimationEnd = (event) => {
                    if (event.target !== popupContainer)
                        return;
                    popupContainer.removeEventListener("animationend", onContainerAnimationEnd);
                    animationEnded();
                };
                popupContainer.addEventListener("animationend", onContainerAnimationEnd);
                popupContainer.style.animation = "popupContainerFadeOut 0.3s var(--transition-easing-style) forwards";
            }
        };
        dismissThisPopup = () => closePopup(undefined, true);
        dismissActivePopup = dismissThisPopup;
        // Render input "OK" button OR custom option buttons
        if (type !== "options") {
            const okBtn = document.createElement('button');
            okBtn.textContent = 'OK';
            okBtn.className = 'nivix-primary-button primary';
            const cancelbtn = document.createElement('button');
            cancelbtn.textContent = 'Cancel';
            cancelbtn.className = 'nivix-secondary-button';
            highlightedButton = okBtn;
            const submitInput = () => {
                closePopup(inputElement ? inputElement.value : "");
            };
            okBtn.addEventListener("click", submitInput);
            cancelbtn.addEventListener('click', () => {
                closePopup(undefined);
            });
            // Allow pressing "Enter" inside the input to submit
            if (inputElement) {
                inputElement.addEventListener("keydown", (e) => {
                    if (e.key === "Enter") {
                        e.preventDefault();
                        submitInput();
                    }
                });
            }
            actionContainer.appendChild(cancelbtn);
            actionContainer.appendChild(okBtn);
        }
        else {
            options.forEach((opt) => {
                const btn = document.createElement("button");
                btn.textContent = opt.content;
                btn.className = opt.highlighted ? "nivix-primary-button primary" : "nivix-secondary-button";
                if (opt.highlighted)
                    highlightedButton = btn;
                btn.addEventListener("click", () => closePopup(opt.value));
                actionContainer.appendChild(btn);
            });
        }
        // Assemble strict layout elements
        popup.appendChild(titleBar);
        popup.appendChild(messageContainer);
        popup.appendChild(actionContainer);
        popupContainer.appendChild(popup);
        document.body.appendChild(popupContainer);
        placePopup(popupContainer, popup, anchor);
        outsidePointerDown = (event) => {
            const target = event.target;
            if (!(target instanceof Node))
                return;
            if (!popup.contains(target) && !anchor?.contains(target)) {
                closePopup(undefined);
            }
        };
        document.addEventListener("pointerdown", outsidePointerDown);
        trapTabNavigation = (event) => {
            if (event.key !== "Tab" || isClosing)
                return;
            const focusableElements = Array.from(popup.querySelectorAll('a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [contenteditable="true"], [tabindex]:not([tabindex="-1"])')).filter((element) => element.tabIndex >= 0 &&
                element.getClientRects().length > 0 &&
                getComputedStyle(element).visibility !== "hidden");
            if (focusableElements.length === 0) {
                event.preventDefault();
                popup.tabIndex = -1;
                popup.focus();
                return;
            }
            const first = focusableElements[0];
            const last = focusableElements[focusableElements.length - 1];
            const activeIndex = focusableElements.indexOf(document.activeElement);
            if (event.shiftKey && activeIndex <= 0) {
                event.preventDefault();
                last.focus();
            }
            else if (!event.shiftKey && activeIndex === focusableElements.length - 1) {
                event.preventDefault();
                first.focus();
            }
            else if (activeIndex === -1) {
                event.preventDefault();
                (event.shiftKey ? last : first).focus();
            }
        };
        document.addEventListener("keydown", trapTabNavigation);
        if (transitionAnimations) {
            popup.style.animation = "nivixFadeIn 0.3s var(--transition-easing-style) forwards";
            if (popupContainer.classList.contains("popup-container-shaded")) {
                popupContainer.style.animation = "popupContainerFadeIn 0.3s var(--transition-easing-style) forwards";
            }
        }
        requestAnimationFrame(() => {
            if (isClosing || !popupContainer.isConnected)
                return;
            if (highlightedButton) {
                highlightedButton.focus();
            }
            else {
                inputElement?.focus();
            }
        });
    });
}

window.Nivix.notifications = { showNotification, showPopup };
})();
