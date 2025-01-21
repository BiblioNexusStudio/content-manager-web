// `use:scrollSync` to apply to scrollable elements
// e.g. `<div use:scrollSync />`
type ScrollSyncAction = {
    (el: HTMLDivElement): { destroy: () => void };
    reset: () => void;
    disable: () => void;
    enable: () => void;
    toggle: () => void;
    isEnabled: () => boolean;
};

export const scrollSync = createScrollSync();

function createScrollSync(): ScrollSyncAction {
    const elements: HTMLDivElement[] = $state([]);
    let scrollPosition: number = $state(0),
        sourceElement: HTMLDivElement | undefined = $state(),
        isEnabled: boolean = $state(true);
    const elementsListeningMap = new WeakMap<HTMLDivElement, boolean>();

    function attachListeners(el: HTMLDivElement) {
        if (!el) return;

        const idx = elements.indexOf(el);
        if (idx === -1 || elementsListeningMap.get(el)) return;

        elements[idx]!.addEventListener('mouseenter', setScrollSyncElement);
        elements[idx]!.addEventListener('focus', setScrollSyncElement);
        elements[idx]!.addEventListener('scroll', handleScroll);
        elementsListeningMap.set(el, true);
    }

    function handleScroll(event: Event) {
        if (!isEnabled) return;

        const target = event.target as HTMLDivElement;
        const scrollHeight = target.scrollHeight;
        const clientHeight = target.clientHeight;
        const scrollTop = target.scrollTop;

        scrollPosition = Math.round((scrollTop / (scrollHeight - clientHeight)) * 1000) / 1000;
        updateScroll();
    }

    function updateScroll() {
        elements.forEach((el) => {
            if (el !== sourceElement) {
                const scrollHeight = el.scrollHeight;
                const clientHeight = el.clientHeight;

                el.scrollTop = scrollPosition * (scrollHeight - clientHeight);
            }
        });
    }

    function setScrollSyncElement(event: Event) {
        sourceElement = event.target as HTMLDivElement;
    }

    function action(el: HTMLDivElement) {
        if (el && !elements.includes(el)) {
            elements.push(el);
            attachListeners(el);
        }

        return {
            destroy() {
                const index = elements.indexOf(el);
                if (index > -1) {
                    elements.splice(index, 1);
                }
                el.removeEventListener('mouseenter', setScrollSyncElement);
                el.removeEventListener('focus', setScrollSyncElement);
                el.removeEventListener('scroll', handleScroll);
            },
        };
    }

    action.reset = function () {
        scrollPosition = 0;
    };

    action.disable = function () {
        isEnabled = false;
    };

    action.enable = function () {
        isEnabled = true;
    };

    action.isEnabled = function () {
        return isEnabled;
    };

    action.toggle = function () {
        isEnabled = !isEnabled;
    };

    return action;
}
