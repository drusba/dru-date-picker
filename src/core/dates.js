import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { PARSE_FORMATS } from './constants.js';

dayjs.extend(customParseFormat);

export { dayjs };

export function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

export function easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
}

export function currentYear() {
    return dayjs().year();
}

export function parseYearExpression(value, fallback) {
    if (value === undefined || value === null || value === '') return fallback;
    if (typeof value === 'number' && Number.isFinite(value)) return Math.trunc(value);

    const text = String(value).trim().toLowerCase();
    const now = currentYear();
    if (text === 'now' || text === 'current') return now;

    const relative = text.match(/^now\s*([+-])\s*(\d+)$/);
    if (relative) {
        const amount = Number(relative[2]);
        return relative[1] === '-' ? now - amount : now + amount;
    }

    const parsed = Number(text);
    return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
}

export function resolveYearBound(explicit, offset, fallback) {
    if (explicit !== undefined && explicit !== null && explicit !== '') {
        return parseYearExpression(explicit, fallback);
    }
    if (offset !== undefined && offset !== null && offset !== '') {
        const parsed = Number(offset);
        if (Number.isFinite(parsed)) return currentYear() + Math.trunc(parsed);
    }
    return parseYearExpression(fallback, currentYear());
}

export function defaultFormat(mode) {
    switch (mode) {
        case 'datetime':
            return 'DD-MM-YYYY HH:mm';
        case 'time':
            return 'HH:mm';
        case 'year-month':
            return 'MM-YYYY';
        default:
            return 'DD-MM-YYYY';
    }
}

export function defaultValueFormat(mode) {
    switch (mode) {
        case 'datetime':
            return 'YYYY-MM-DD HH:mm';
        case 'time':
            return 'HH:mm';
        case 'year-month':
            return 'YYYY-MM';
        default:
            return 'YYYY-MM-DD';
    }
}

export function getMonthNames(locale = 'en') {
    return Array.from({ length: 12 }, (_, index) => (
        new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date(2020, index, 1))
    ));
}

export function parseIncomingDate(value, extraFormats = []) {
    if (!value) return null;
    if (dayjs.isDayjs(value)) return value.isValid() ? value : null;
    if (value instanceof Date) {
        const parsed = dayjs(value);
        return parsed.isValid() ? parsed : null;
    }

    const formats = [...extraFormats, ...PARSE_FORMATS].filter(Boolean);
    const parsed = dayjs(String(value), formats, true);
    if (parsed.isValid()) return parsed;

    const loose = dayjs(value);
    return loose.isValid() ? loose : null;
}

export function daysInMonth(year, monthIndex) {
    return dayjs(new Date(year, monthIndex + 1, 0)).date();
}

export function range(length, start = 0, pad = false) {
    return Array.from({ length }, (_, index) => {
        const value = start + index;
        return pad ? String(value).padStart(2, '0') : value;
    });
}

export function formatTokens(format) {
    return format?.match(/(YYYY|MMMM|MMM|MM|DD|HH|mm)/g) || [];
}

export function formatWithMonths(date, format, months) {
    if (!date?.isValid()) return '';
    let next = format || defaultFormat('date');
    if (months?.[date.month()]) {
        if (next.includes('MMMM')) {
            next = next.replace('MMMM', `[${months[date.month()]}]`);
        }
        else if (next.includes('MMM')) {
            next = next.replace('MMM', `[${months[date.month()].slice(0, 3)}]`);
        }
    }
    return date.format(next);
}

export function applyTheme(el, colors = {}) {
    if (!el) return;
    Object.entries(colors).forEach(([prop, cssVar]) => {
        const value = colors[prop];
        if (typeof cssVar === 'string' && cssVar.startsWith('--') && value) {
            el.style.setProperty(cssVar, value);
        }
    });
}

export function setColorVars(el, colors) {
    if (!el || !colors) return;
    const map = {
        accentColor: '--dru-accent',
        textColor: '--dru-text',
        mutedColor: '--dru-muted',
        panelBackground: '--dru-panel-bg',
        highlightColor: '--dru-highlight',
        backdropColor: '--dru-backdrop',
        borderColor: '--dru-border',
    };
    Object.entries(map).forEach(([key, cssVar]) => {
        if (colors[key]) el.style.setProperty(cssVar, colors[key]);
    });
}
