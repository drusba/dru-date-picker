import { ATTR_TO_PROP, ELEMENT_TAG, MOBILE_BREAKPOINT } from '../core/constants.js';
import { clamp, setColorVars } from '../core/dates.js';
import { assignOptions, colorPayload, normalizeOptions, toNumber } from '../core/options.js';
import { PickerState } from '../core/state.js';
import { WheelEngine } from '../core/WheelEngine.js';
import { ensureStyles } from './styles.js';

function isClient() {
    return typeof window !== 'undefined' && typeof document !== 'undefined';
}

export class DruDatePickerElement extends HTMLElement {
    static get observedAttributes() {
        return Object.keys(ATTR_TO_PROP);
    }

    constructor() {
        super();
        this.options = normalizeOptions();
        this.state = new PickerState(this.options);
        this.isOpen = false;
        this.isNarrow = false;
        this.popoverStyle = {};
        this.columnEls = {};
        this.wheels = {};
        this.snapshot = null;
        this.lockedScrollY = 0;
        this.scrollLocked = false;
        this.lockedBodyStyles = null;
        this.inputEl = null;
        this.panelRoot = null;
        this._ready = false;

        this.onInputClick = this.onInputClick.bind(this);
        this.onCancel = this.onCancel.bind(this);
        this.onConfirm = this.onConfirm.bind(this);
        this.onKeydown = this.onKeydown.bind(this);
        this.onResize = this.onResize.bind(this);
        this.onBackdropClick = this.onBackdropClick.bind(this);
    }

    connectedCallback() {
        ensureStyles();
        this.syncFromAttributes();
        this.renderInput();
        this.applyTheme();
        this.hydrate();
        this.updateNarrow();
        if (isClient()) {
            window.addEventListener('resize', this.onResize);
            window.addEventListener('keydown', this.onKeydown);
        }
        this._ready = true;
    }

    disconnectedCallback() {
        this.destroyWheels();
        if (this.isOpen) this.unlockScroll();
        this.removePanel();
        if (isClient()) {
            window.removeEventListener('resize', this.onResize);
            window.removeEventListener('keydown', this.onKeydown);
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;
        const prop = ATTR_TO_PROP[name];
        if (!prop) return;
        this.setOption(prop, this.castAttribute(prop, newValue));
    }

    castAttribute(prop, value) {
        if (value === null) return undefined;
        if (prop === 'disabled' || prop === 'showTime') {
            return value === '' || value === 'true' || value === '1';
        }
        if (prop === 'minYear' || prop === 'maxYear') {
            return toNumber(value, undefined);
        }
        return value;
    }

    syncFromAttributes() {
        const patch = {};
        Object.entries(ATTR_TO_PROP).forEach(([attr, prop]) => {
            if (this.hasAttribute(attr)) {
                patch[prop] = this.castAttribute(prop, this.getAttribute(attr));
            }
        });
        this.options = assignOptions(this.options, patch);
        this.state.setOptions(this.options);
    }

    setOption(key, value) {
        if (value === undefined) return;
        this.options = assignOptions(this.options, { [key]: value });
        this.state.setOptions(this.options);
        if (key === 'value' || key === 'birthday' || key === 'startDate') {
            this.state.hydrateFromValue(this.options.value || this.options.birthday || this.options.startDate, true);
        }
        if (this._ready) {
            this.applyTheme();
            this.syncInput();
            if (this.isOpen) this.refreshOpenPanel();
        }
    }

    get value() {
        return this.state.displayValue();
    }

    set value(next) {
        this.options = assignOptions(this.options, { value: next ?? '' });
        this.state.setOptions(this.options);
        this.state.hydrateFromValue(next, true);
        this.syncInput();
    }

    hydrate() {
        const incoming = this.options.value || this.options.birthday || this.options.startDate;
        if (incoming) {
            this.state.hydrateFromValue(incoming, true);
            this.syncInput();
            this.emit('change', this.state.emitValue(), { bubbles: false });
        }
        else {
            this.state.applyDate(this.state.currentSelectedDate(), { fillInput: false });
        }
    }

    renderInput() {
        this.innerHTML = '';
        const wrap = document.createElement('div');
        wrap.className = 'datepicker-parent-wrapper';

        const input = document.createElement('input');
        input.type = 'text';
        input.readOnly = true;
        input.inputMode = 'none';
        input.className = 'form-control dateInput';
        input.addEventListener('click', this.onInputClick);
        input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                this.onInputClick();
            }
        });

        wrap.appendChild(input);
        this.appendChild(wrap);
        this.inputEl = input;
        this.wrapperEl = wrap;
        this.syncInput();
    }

    syncInput() {
        if (!this.inputEl) return;
        this.inputEl.value = this.state.displayValue();
        this.inputEl.placeholder = this.options.placeholder;
        this.inputEl.disabled = this.options.disabled;
        this.inputEl.id = this.options.id || '';
        if (this.options.name) this.inputEl.setAttribute('name', this.options.name);
        else this.inputEl.removeAttribute('name');
    }

    applyTheme() {
        const colors = colorPayload(this.options);
        setColorVars(this, colors);
        if (this.wrapperEl) setColorVars(this.wrapperEl, colors);
        if (this.panelRoot) setColorVars(this.panelRoot, colors);
    }

    get isMobileLayout() {
        return this.isNarrow;
    }

    updateNarrow() {
        if (!isClient()) return;
        this.isNarrow = window.innerWidth <= MOBILE_BREAKPOINT;
        if (this.isOpen) {
            this.updatePanelLayout();
            this.updatePopoverPosition();
        }
    }

    onResize() {
        this.updateNarrow();
        this.updatePopoverPosition();
    }

    onKeydown(event) {
        if (!this.isOpen) return;
        if (event.key === 'Escape') this.onCancel();
        if (event.key === 'Enter') this.onConfirm();
    }

    onInputClick() {
        if (this.options.disabled) return;
        if (this.isOpen) {
            if (!this.isMobileLayout) this.onCancel();
            return;
        }
        this.open();
    }

    async open() {
        if (!isClient() || this.isOpen) return;
        this.state.ensureInitialDate();
        this.snapshot = this.state.snapshot();
        this.isOpen = true;
        this.lockScroll();
        this.renderPanel();
        this.applyTheme();
        this.updatePopoverPosition();
        await this.waitForPaint();
        this.initWheels();
        this.emit('open');
    }

    close() {
        this.destroyWheels();
        this.removePanel();
        this.isOpen = false;
        this.unlockScroll();
        this.emit('close');
    }

    onCancel() {
        this.state.restore(this.snapshot);
        this.syncInput();
        this.close();
        this.emit('cancel');
    }

    onConfirm() {
        const payload = this.state.emitValue();
        this.syncInput();
        this.close();
        if (payload) {
            this.options = assignOptions(this.options, { value: payload.value });
            this.emit('change', payload);
            this.emit('confirm', payload);
        }
    }

    onBackdropClick() {
        this.onCancel();
    }

    emit(name, detail, extras = {}) {
        this.dispatchEvent(new CustomEvent(name, {
            detail: detail ?? null,
            bubbles: extras.bubbles !== false,
            composed: true,
        }));
    }

    renderPanel() {
        this.removePanel();
        const root = document.createElement('div');
        root.className = `dru-date-root ${this.isMobileLayout ? 'is-mobile' : 'is-desktop'}`;

        const backdrop = document.createElement('div');
        backdrop.className = 'dru-date-backdrop';
        backdrop.addEventListener('click', this.onBackdropClick);

        const panel = document.createElement('div');
        panel.className = `dru-date-panel ${this.isMobileLayout ? 'dru-date-panel--sheet' : 'dru-date-panel--popover'}`;
        panel.addEventListener('click', (event) => event.stopPropagation());

        const toolbar = document.createElement('div');
        toolbar.className = 'dru-date-toolbar';

        const cancel = document.createElement('button');
        cancel.type = 'button';
        cancel.className = 'dru-date-btn';
        cancel.textContent = this.options.cancelText;
        cancel.addEventListener('click', this.onCancel);

        const title = document.createElement('span');
        title.className = 'dru-date-title';
        title.textContent = this.options.label || '';

        const confirm = document.createElement('button');
        confirm.type = 'button';
        confirm.className = 'dru-date-btn dru-date-btn--done';
        confirm.textContent = this.options.confirmText;
        confirm.addEventListener('click', this.onConfirm);

        toolbar.append(cancel, title, confirm);

        const wheels = document.createElement('div');
        wheels.className = 'dru-date-wheels';

        const highlight = document.createElement('div');
        highlight.className = 'dru-date-highlight';
        wheels.appendChild(highlight);

        this.columnEls = {};
        this.state.columns.forEach((column) => {
            const col = document.createElement('div');
            col.className = `dru-date-column ${column.key}-column`;
            const list = document.createElement('ul');
            list.className = 'dru-date-list';
            column.items.forEach((item, index) => {
                const li = document.createElement('li');
                li.className = 'dru-date-item';
                li.textContent = String(item);
                li.addEventListener('click', () => this.onItemClick(column.key, index));
                list.appendChild(li);
            });
            col.appendChild(list);
            wheels.appendChild(col);
            this.columnEls[column.key] = col;
        });

        panel.append(toolbar, wheels);
        root.append(backdrop, panel);
        document.body.appendChild(root);

        this.panelRoot = root;
        this.panelEl = panel;
        this.titleEl = title;
        this.cancelEl = cancel;
        this.confirmEl = confirm;
        this.applyTheme();
        this.updatePanelLayout();
    }

    refreshOpenPanel() {
        if (!this.isOpen) return;
        if (this.cancelEl) this.cancelEl.textContent = this.options.cancelText;
        if (this.confirmEl) this.confirmEl.textContent = this.options.confirmText;
        if (this.titleEl) this.titleEl.textContent = this.options.label || '';
        this.renderPanel();
        this.initWheels();
    }

    updatePanelLayout() {
        if (!this.panelRoot || !this.panelEl) return;
        this.panelRoot.classList.toggle('is-mobile', this.isMobileLayout);
        this.panelRoot.classList.toggle('is-desktop', !this.isMobileLayout);
        this.panelEl.classList.toggle('dru-date-panel--sheet', this.isMobileLayout);
        this.panelEl.classList.toggle('dru-date-panel--popover', !this.isMobileLayout);
    }

    updatePopoverPosition() {
        if (!this.inputEl || !this.panelEl || this.isMobileLayout) {
            if (this.panelEl && this.isMobileLayout) {
                this.panelEl.style.top = '';
                this.panelEl.style.left = '';
                this.panelEl.style.width = '';
            }
            return;
        }

        const rect = this.inputEl.getBoundingClientRect();
        const panelWidth = 300;
        const panelHeight = 310;
        const gap = 8;
        const left = clamp(rect.left, 12, window.innerWidth - panelWidth - 12);
        const spaceBelow = window.innerHeight - rect.bottom;
        const top = spaceBelow > panelHeight + gap
            ? rect.bottom + gap
            : Math.max(12, rect.top - panelHeight - gap);

        this.panelEl.style.top = `${top}px`;
        this.panelEl.style.left = `${left}px`;
        this.panelEl.style.width = `${Math.min(panelWidth, window.innerWidth - 24)}px`;
    }

    initWheels() {
        this.destroyWheels();
        this.state.columns.forEach((column) => {
            const el = this.columnEls[column.key];
            if (!el) return;
            this.wheels[column.key] = new WheelEngine({
                columnEl: el,
                items: column.items,
                index: this.state.columnIndex(column.key),
                onChange: (index) => this.onWheelChange(column.key, index),
                onTick: () => this.options.onTick?.(),
            });
        });
    }

    destroyWheels() {
        Object.keys(this.wheels).forEach((key) => {
            this.wheels[key]?.destroy();
            delete this.wheels[key];
        });
    }

    onWheelChange(key, index) {
        const previousDays = this.state.days.length;
        this.state.setColumnIndex(key, index);
        this.syncInput();
        if ((key === 'year' || key === 'month') && this.state.days.length !== previousDays) {
            this.rebuildDayColumn();
        }
    }

    rebuildDayColumn() {
        const column = this.columnEls.day;
        const list = column?.querySelector('.dru-date-list');
        if (!list) return;
        list.innerHTML = '';
        this.state.days.forEach((item, index) => {
            const li = document.createElement('li');
            li.className = 'dru-date-item';
            li.textContent = String(item);
            li.addEventListener('click', () => this.onItemClick('day', index));
            list.appendChild(li);
        });
        this.wheels.day?.setItems(this.state.days, this.state.dayIndex);
    }

    onItemClick(key, index) {
        const wheel = this.wheels[key];
        if (!wheel || wheel.moved) return;
        wheel.goTo(index, true);
    }

    removePanel() {
        this.panelRoot?.remove();
        this.panelRoot = null;
        this.panelEl = null;
        this.columnEls = {};
    }

    lockScroll() {
        if (!isClient() || this.scrollLocked) return;
        this.scrollLocked = true;
        this.lockedScrollY = window.scrollY;
        this.lockedBodyStyles = {
            position: document.body.style.position,
            top: document.body.style.top,
            left: document.body.style.left,
            right: document.body.style.right,
            width: document.body.style.width,
            overflow: document.body.style.overflow,
            paddingRight: document.body.style.paddingRight,
            boxSizing: document.body.style.boxSizing,
        };

        const scrollbarWidth = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
        const currentPadding = parseFloat(getComputedStyle(document.body).paddingRight) || 0;

        document.body.style.boxSizing = 'border-box';
        document.body.style.position = 'fixed';
        document.body.style.top = `-${this.lockedScrollY}px`;
        document.body.style.left = '0';
        document.body.style.right = '0';
        document.body.style.width = '100%';
        document.body.style.overflow = 'hidden';
        document.body.style.paddingRight = `${currentPadding + scrollbarWidth}px`;
    }

    unlockScroll() {
        if (!isClient() || !this.scrollLocked) return;
        const prev = this.lockedBodyStyles || {};
        document.body.style.position = prev.position;
        document.body.style.top = prev.top;
        document.body.style.left = prev.left;
        document.body.style.right = prev.right;
        document.body.style.width = prev.width;
        document.body.style.overflow = prev.overflow;
        document.body.style.paddingRight = prev.paddingRight;
        document.body.style.boxSizing = prev.boxSizing;
        this.scrollLocked = false;
        this.lockedBodyStyles = null;
        window.scrollTo(0, this.lockedScrollY);
    }

    waitForPaint() {
        return new Promise((resolve) => {
            requestAnimationFrame(() => requestAnimationFrame(resolve));
        });
    }
}

function defineOptionAccessors(Ctor) {
    const skip = new Set(['value']);
    Object.keys(normalizeOptions()).forEach((key) => {
        if (skip.has(key) || key in Ctor.prototype) return;
        Object.defineProperty(Ctor.prototype, key, {
            get() {
                return this.options[key];
            },
            set(value) {
                this.setOption(key, value);
            },
        });
    });
}

defineOptionAccessors(DruDatePickerElement);

export function register(tag = ELEMENT_TAG) {
    if (typeof customElements === 'undefined') return tag;
    if (!customElements.get(tag)) {
        customElements.define(tag, DruDatePickerElement);
    }
    return tag;
}

export function applyOptionsToElement(el, options = {}) {
    if (!el) return;
    const patch = { ...options };
    el.options = assignOptions(el.options, patch);
    el.state.setOptions(el.options);
    if (options.value || options.birthday || options.startDate) {
        el.state.hydrateFromValue(options.value || options.birthday || options.startDate, true);
    }
    if (el._ready) {
        el.applyTheme();
        el.syncInput();
        if (el.isOpen) el.refreshOpenPanel();
    }
}

if (isClient()) register();
