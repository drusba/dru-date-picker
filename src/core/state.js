import { clamp, dayjs, daysInMonth, formatTokens, formatWithMonths, parseIncomingDate, range } from './dates.js';

export class PickerState {
    constructor(options) {
        this.options = options;
        this.yearIndex = 0;
        this.monthIndex = 0;
        this.dayIndex = 0;
        this.hourIndex = 0;
        this.minuteIndex = 0;
        this.formatted = '';
        this.hasSetInitialDate = false;
    }

    setOptions(options) {
        this.options = options;
        this.yearIndex = clamp(this.yearIndex, 0, Math.max(this.years.length - 1, 0));
        this.dayIndex = clamp(this.dayIndex, 0, Math.max(this.days.length - 1, 0));
    }

    get minYear() {
        const fromDate = parseIncomingDate(this.options.minDate);
        const optionYear = this.options.minYear || 1920;
        return fromDate ? Math.max(optionYear, fromDate.year()) : optionYear;
    }

    get maxYear() {
        const fromDate = parseIncomingDate(this.options.maxDate);
        const optionYear = this.options.maxYear || dayjs().year();
        return fromDate ? Math.min(optionYear, fromDate.year()) : optionYear;
    }

    get years() {
        const start = this.minYear;
        const end = Math.max(this.maxYear, start);
        return range(end - start + 1, start);
    }

    get months() {
        return this.options.months;
    }

    get days() {
        const year = this.years[this.yearIndex] || this.maxYear;
        return range(daysInMonth(year, this.monthIndex), 1);
    }

    get hours() {
        return range(24, 0, true);
    }

    get minutes() {
        return range(60, 0, true);
    }

    get columns() {
        const mode = this.options.mode;
        const tokens = formatTokens(this.options.format);
        const cols = [];
        const push = (key, items) => {
            if (!cols.some((col) => col.key === key)) {
                cols.push({ key, items });
            }
        };

        const tokenMap = {
            YYYY: () => push('year', this.years),
            MMMM: () => push('month', this.months),
            MMM: () => push('month', this.months),
            MM: () => push('month', this.months),
            DD: () => push('day', this.days),
            HH: () => push('hour', this.hours),
            mm: () => push('minute', this.minutes),
        };

        tokens.forEach((token) => tokenMap[token]?.());

        if (mode === 'date' && !cols.length) {
            push('month', this.months);
            push('day', this.days);
            push('year', this.years);
        }

        if (mode === 'year-month') {
            if (!cols.some((col) => col.key === 'month')) push('month', this.months);
            if (!cols.some((col) => col.key === 'year')) push('year', this.years);
            return cols.filter((col) => col.key === 'month' || col.key === 'year');
        }

        if (mode === 'time') {
            if (!cols.some((col) => col.key === 'hour')) push('hour', this.hours);
            if (!cols.some((col) => col.key === 'minute')) push('minute', this.minutes);
            return cols.filter((col) => col.key === 'hour' || col.key === 'minute');
        }

        if (mode === 'datetime') {
            if (!cols.some((col) => col.key === 'hour')) push('hour', this.hours);
            if (!cols.some((col) => col.key === 'minute')) push('minute', this.minutes);
        }

        return cols;
    }

    columnIndex(key) {
        switch (key) {
            case 'month': return this.monthIndex;
            case 'day': return this.dayIndex;
            case 'year': return this.yearIndex;
            case 'hour': return this.hourIndex;
            case 'minute': return this.minuteIndex;
            default: return 0;
        }
    }

    setColumnIndex(key, index) {
        switch (key) {
            case 'year':
                this.yearIndex = index;
                this.dayIndex = clamp(this.dayIndex, 0, this.days.length - 1);
                break;
            case 'month':
                this.monthIndex = index;
                this.dayIndex = clamp(this.dayIndex, 0, this.days.length - 1);
                break;
            case 'day':
                this.dayIndex = index;
                break;
            case 'hour':
                this.hourIndex = index;
                break;
            case 'minute':
                this.minuteIndex = index;
                break;
            default:
                break;
        }
        this.updatePreview();
    }

    currentSelectedDate() {
        const mode = this.options.mode;
        const now = dayjs();

        if (mode === 'time') {
            return now
                .hour(Number(this.hours[this.hourIndex] || 0))
                .minute(Number(this.minutes[this.minuteIndex] || 0))
                .second(0)
                .millisecond(0);
        }

        const year = this.years[this.yearIndex] ?? this.maxYear;
        const month = this.monthIndex;
        const day = mode === 'year-month'
            ? 1
            : clamp(this.days[this.dayIndex] || 1, 1, this.days.length);
        let date = dayjs(new Date(year, month, day));

        if (mode === 'datetime') {
            date = date
                .hour(Number(this.hours[this.hourIndex] || 0))
                .minute(Number(this.minutes[this.minuteIndex] || 0));
        }

        return this.clampToBounds(date);
    }

    clampToBounds(date) {
        const min = parseIncomingDate(this.options.minDate);
        const max = parseIncomingDate(this.options.maxDate);
        if (min && date.isBefore(min)) return min;
        if (max && date.isAfter(max)) return max;
        return date;
    }

    applyDate(parsed, { fillInput = true } = {}) {
        if (!parsed?.isValid()) return false;

        const yearIndex = this.years.indexOf(parsed.year());
        this.yearIndex = yearIndex === -1 ? this.years.length - 1 : yearIndex;
        this.monthIndex = parsed.month();
        this.dayIndex = clamp(parsed.date() - 1, 0, this.days.length - 1);
        this.hourIndex = parsed.hour();
        this.minuteIndex = parsed.minute();

        if (fillInput) this.updatePreview();
        return true;
    }

    ensureInitialDate() {
        if (this.hasSetInitialDate) return;
        const incoming = parseIncomingDate(this.options.value, [this.options.format, this.options.valueFormat])
            || parseIncomingDate(this.options.birthday, [this.options.format, this.options.valueFormat])
            || parseIncomingDate(this.options.startDate, [this.options.format, this.options.valueFormat]);

        if (incoming) this.applyDate(incoming, { fillInput: false });
        else this.applyDate(dayjs(), { fillInput: false });
        this.hasSetInitialDate = true;
    }

    hydrateFromValue(value, fillInput = true) {
        const incoming = parseIncomingDate(value, [this.options.format, this.options.valueFormat]);
        if (incoming) {
            this.applyDate(incoming, { fillInput });
            this.hasSetInitialDate = true;
            return true;
        }
        this.applyDate(dayjs(), { fillInput: false });
        return false;
    }

    formatDate(parsed, format = this.options.format) {
        return formatWithMonths(parsed, format, this.months);
    }

    updatePreview() {
        const parsed = this.currentSelectedDate();
        if (parsed.isValid()) {
            this.formatted = this.formatDate(parsed);
        }
        return this.formatted;
    }

    displayValue() {
        return this.formatted || this.options.value || '';
    }

    emitValue() {
        const parsed = this.currentSelectedDate();
        if (!parsed.isValid()) return null;
        this.formatted = this.formatDate(parsed);
        return {
            value: this.formatted,
            date: this.formatDate(parsed, this.options.valueFormat),
            iso: parsed.toISOString(),
        };
    }

    snapshot() {
        return {
            formatted: this.formatted,
            year: this.yearIndex,
            month: this.monthIndex,
            day: this.dayIndex,
            hour: this.hourIndex,
            minute: this.minuteIndex,
        };
    }

    restore(state) {
        if (!state) return;
        this.yearIndex = state.year;
        this.monthIndex = state.month;
        this.dayIndex = state.day;
        this.hourIndex = state.hour;
        this.minuteIndex = state.minute;
        this.formatted = state.formatted;
    }
}
