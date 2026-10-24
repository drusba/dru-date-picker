import { applyOptionsToElement, DruDatePickerElement, register } from '../element/DruDatePicker.js';

export function createDatePicker(target, options = {}) {
    register();

    const host = typeof target === 'string' ? document.querySelector(target) : target;
    if (!host) {
        throw new Error('dru-date-picker: target element was not found');
    }

    const el = document.createElement('dru-date-picker');
    applyOptionsToElement(el, options);

    let hiddenInput = null;
    if (host.tagName === 'INPUT') {
        hiddenInput = host;
        host.style.display = 'none';
        host.insertAdjacentElement('afterend', el);
        if (host.value && !options.value) el.value = host.value;
        el.addEventListener('change', (event) => {
            host.value = event.detail?.value ?? '';
            host.dispatchEvent(new Event('input', { bubbles: true }));
            host.dispatchEvent(new Event('change', { bubbles: true }));
        });
    }
    else {
        host.appendChild(el);
    }

    return {
        el,
        get value() {
            return el.value;
        },
        set value(next) {
            el.value = next;
        },
        open() {
            return el.open();
        },
        close() {
            return el.close();
        },
        setYearBounds(minYear, maxYear) {
            if (minYear !== undefined) el.minYear = minYear;
            if (maxYear !== undefined) el.maxYear = maxYear;
        },
        on(eventName, handler) {
            el.addEventListener(eventName, handler);
            return () => el.removeEventListener(eventName, handler);
        },
        destroy() {
            el.remove();
            if (hiddenInput) hiddenInput.style.display = '';
        },
    };
}

export { DruDatePickerElement, register };
