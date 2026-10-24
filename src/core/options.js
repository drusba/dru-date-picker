import { COLOR_VARS, DEFAULT_COLORS, MODES } from './constants.js';
import { currentYear, defaultFormat, defaultValueFormat, getMonthNames } from './dates.js';

export function normalizeOptions(input = {}) {
    const mode = resolveMode(input);
    const locale = input.locale || 'en';
    const months = Array.isArray(input.months) && input.months.length === 12
        ? input.months
        : getMonthNames(locale);

    return {
        value: input.value ?? '',
        mode,
        format: input.format || input.formatToShow || defaultFormat(mode),
        valueFormat: input.valueFormat || input.formatToResponse || defaultValueFormat(mode),
        minYear: toNumber(input.minYear, 1920),
        maxYear: toNumber(input.maxYear, currentYear()),
        minDate: input.minDate || '',
        maxDate: input.maxDate || '',
        label: input.label || '',
        placeholder: input.placeholder || input.name || 'Select Date',
        confirmText: input.confirmText || input.confirmLabel || 'Set Date',
        cancelText: input.cancelText || 'Close',
        locale,
        months,
        id: input.id || '',
        name: input.name || '',
        disabled: Boolean(input.disabled),
        startDate: input.startDate || '',
        birthday: input.birthday || '',
        onTick: typeof input.onTick === 'function' ? input.onTick : null,
        accentColor: input.accentColor || DEFAULT_COLORS.accentColor,
        textColor: input.textColor || DEFAULT_COLORS.textColor,
        mutedColor: input.mutedColor || DEFAULT_COLORS.mutedColor,
        panelBackground: input.panelBackground || DEFAULT_COLORS.panelBackground,
        highlightColor: input.highlightColor || DEFAULT_COLORS.highlightColor,
        backdropColor: input.backdropColor || DEFAULT_COLORS.backdropColor,
        borderColor: input.borderColor || DEFAULT_COLORS.borderColor,
    };
}

export function resolveMode(input = {}) {
    if (input.mode && MODES.includes(input.mode)) return input.mode;
    if (input.showTime === true || input.showTime === '' || input.showTime === 'true') {
        return 'datetime';
    }
    return 'date';
}

export function toNumber(value, fallback) {
    if (value === undefined || value === null || value === '') return fallback;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

export function colorPayload(options) {
    return Object.keys(COLOR_VARS).reduce((payload, key) => {
        payload[key] = options[key];
        return payload;
    }, {});
}

export function assignOptions(target, patch = {}) {
    const merged = { ...target, ...patch };
    if (patch.locale && !patch.months) {
        delete merged.months;
    }
    return normalizeOptions(merged);
}
