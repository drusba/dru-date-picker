<template>
    <div class="datepicker-parent-wrapper">
        <input
            :id="id"
            ref="inputField"
            v-model="formattedDate"
            type="text"
            :placeholder="name"
            readonly
            inputmode="none"
            class="form-control dateInput"
            @click="onInputClick"
            @keydown.enter.prevent="onInputClick"
        >

        <Teleport to="body">
            <div
                v-if="isOpen"
                class="dru-date-root"
                :class="isMobileLayout ? 'is-mobile' : 'is-desktop'"
            >
                <div
                    class="dru-date-backdrop"
                    @click="onCancel"
                />

                <div
                    class="dru-date-panel"
                    :class="isMobileLayout ? 'dru-date-panel--sheet' : 'dru-date-panel--popover'"
                    :style="isMobileLayout ? undefined : popoverStyle"
                    @click.stop
                >
                    <div class="dru-date-toolbar">
                        <button
                            type="button"
                            class="dru-date-btn"
                            @click="onCancel"
                        >
                            Close
                        </button>
                        <span
                            v-if="label"
                            class="dru-date-title"
                        >{{ label }}</span>
                        <button
                            type="button"
                            class="dru-date-btn dru-date-btn--done"
                            @click="onConfirm"
                        >
                            {{ props.confirmLabel }}
                        </button>
                    </div>

                    <div class="dru-date-wheels">
                        <div class="dru-date-highlight" />

                        <div
                            v-for="column in columns"
                            :key="column.key"
                            :ref="(el) => setColumnRef(column.key, el)"
                            class="dru-date-column"
                            :class="`${column.key}-column`"
                        >
                            <ul class="dru-date-list">
                                <li
                                    v-for="(item, index) in column.items"
                                    :key="`${column.key}-${item}`"
                                    class="dru-date-item"
                                    @click="onItemClick(column.key, index)"
                                >
                                    {{ item }}
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </Teleport>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { Capacitor } from '@capacitor/core';
import { Haptics } from '@capacitor/haptics';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

const ITEM_HEIGHT = 36;
const VISIBLE_COUNT = 7;
const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE_COUNT;
const CENTER_OFFSET = (WHEEL_HEIGHT - ITEM_HEIGHT) / 2;
const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

const props = defineProps({
    label: { type: String, default: '' },
    id: { type: String },
    showTime: { type: Boolean, default: false },
    formatToShow: { type: String, default: 'DD-MM-YYYY' },
    objectIndex: Number,
    name: { type: String, default: 'Select Date' },
    formatToResponse: {
        type: String,
        default: 'YYYY-MM-DD',
    },
    birthday: { type: String, default: '' },
    modelValue: { type: String, default: '' },
    confirmLabel: {
        type: String,
        default: 'Set Date',
        required: false,
    },
    minYear: {
        type: Number,
        default: 1920,
        required: false,
    },
    maxYear: {
        type: Number,
        default: dayjs().year(),
        required: false,
    },
    startDate: {
        type: String,
    },
});

const emit = defineEmits(['update:modelValue', 'change']);

const { $iOS, $android, $webiOS, $webAndroid } = useNuxtApp();
const { isMobile } = useDevice();

const inputField = ref(null);
const isOpen = ref(false);
const formattedDate = ref('');
const hasSetInitialDate = ref(false);
const popoverStyle = ref({});
const isNarrow = ref(false);

const selectedYearIndex = ref(0);
const selectedMonthIndex = ref(0);
const selectedDayIndex = ref(0);
const selectedHourIndex = ref(0);
const selectedMinuteIndex = ref(0);

const columnEls = {};
const wheels = {};
let snapshot = null;
let lockedScrollY = 0;
let hapticTimer = 0;

const isMobileLayout = computed(() => {
    return Boolean(
        $iOS
        || $android
        || $webiOS
        || $webAndroid
        || isMobile
        || isNarrow.value,
    );
});

const minYear = computed(() => props.minYear || 1920);
const maxYear = computed(() => props.maxYear || dayjs().year());

const years = computed(() => {
    const start = minYear.value;
    const end = maxYear.value;
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
});

const months = computed(() => MONTH_NAMES);

const days = computed(() => {
    const year = years.value[selectedYearIndex.value] || maxYear.value;
    const month = selectedMonthIndex.value;
    const count = dayjs(new Date(year, month + 1, 0)).date();
    return Array.from({ length: count }, (_, i) => i + 1);
});

const hours = computed(() => Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')));
const minutes = computed(() => Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')));

const parsedFormatOrder = computed(() => {
    const formatParts = props.formatToShow.match(/(YYYY|MM|DD)/g);
    return formatParts || ['MM', 'DD', 'YYYY'];
});

const columnIndex = (key) => {
    switch (key) {
        case 'month': return selectedMonthIndex.value;
        case 'day': return selectedDayIndex.value;
        case 'year': return selectedYearIndex.value;
        case 'hour': return selectedHourIndex.value;
        case 'minute': return selectedMinuteIndex.value;
        default: return 0;
    }
};

const columns = computed(() => {
    const cols = [];
    parsedFormatOrder.value.forEach((part) => {
        if (part === 'MM') cols.push({ key: 'month', items: months.value });
        else if (part === 'DD') cols.push({ key: 'day', items: days.value });
        else if (part === 'YYYY') cols.push({ key: 'year', items: years.value });
    });

    if (props.showTime) {
        cols.push({ key: 'hour', items: hours.value });
        cols.push({ key: 'minute', items: minutes.value });
    }

    return cols;
});

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
}

function parseIncomingDate(value) {
    if (!value) return null;
    const parsed = dayjs(
        value,
        [props.formatToShow, props.formatToResponse, 'YYYY-MM-DD', 'MM-DD-YYYY', 'DD-MM-YYYY'],
        true,
    );
    return parsed.isValid() ? parsed : null;
}

function currentSelectedDate() {
    const year = years.value[selectedYearIndex.value] ?? maxYear.value;
    const month = selectedMonthIndex.value;
    const day = clamp(days.value[selectedDayIndex.value] || 1, 1, days.value.length);
    const date = dayjs(new Date(year, month, day));

    if (props.showTime) {
        return date
            .hour(Number(hours.value[selectedHourIndex.value] || 0))
            .minute(Number(minutes.value[selectedMinuteIndex.value] || 0));
    }

    return date;
}

function applyDate(parsed, { fillInput = true } = {}) {
    if (!parsed?.isValid()) return;

    const yearIndex = years.value.indexOf(parsed.year());
    selectedYearIndex.value = yearIndex === -1 ? years.value.length - 1 : yearIndex;
    selectedMonthIndex.value = parsed.month();
    selectedDayIndex.value = clamp(parsed.date() - 1, 0, 30);

    if (props.showTime) {
        selectedHourIndex.value = parsed.hour();
        selectedMinuteIndex.value = parsed.minute();
    }

    selectedDayIndex.value = clamp(parsed.date() - 1, 0, days.value.length - 1);

    if (fillInput) {
        formattedDate.value = currentSelectedDate().format(props.formatToShow);
    }
}

function setCurrentDateIndices() {
    applyDate(dayjs(), { fillInput: false });
}

function captureState() {
    return {
        formatted: formattedDate.value,
        year: selectedYearIndex.value,
        month: selectedMonthIndex.value,
        day: selectedDayIndex.value,
        hour: selectedHourIndex.value,
        minute: selectedMinuteIndex.value,
    };
}

function restoreState(state) {
    if (!state) return;
    selectedYearIndex.value = state.year;
    selectedMonthIndex.value = state.month;
    selectedDayIndex.value = state.day;
    selectedHourIndex.value = state.hour;
    selectedMinuteIndex.value = state.minute;
    formattedDate.value = state.formatted;
}

function emitDateValue() {
    const parsedDate = currentSelectedDate();
    if (!parsedDate.isValid()) return;

    const shown = parsedDate.format(props.formatToShow);
    formattedDate.value = shown;
    emit('update:modelValue', shown);
    emit('change', {
        newDate: parsedDate.format('YYYY-MM-DD'),
        objectIndex: props.objectIndex ?? null,
    });
}

function updatePreview() {
    const parsedDate = currentSelectedDate();
    if (parsedDate.isValid()) {
        formattedDate.value = parsedDate.format(props.formatToShow);
    }
}

function setColumnIndex(key, index) {
    switch (key) {
        case 'year':
            if (selectedYearIndex.value !== index) selectedYearIndex.value = index;
            break;
        case 'month':
            if (selectedMonthIndex.value !== index) selectedMonthIndex.value = index;
            break;
        case 'day':
            if (selectedDayIndex.value !== index) selectedDayIndex.value = index;
            break;
        case 'hour':
            if (selectedHourIndex.value !== index) selectedHourIndex.value = index;
            break;
        case 'minute':
            if (selectedMinuteIndex.value !== index) selectedMinuteIndex.value = index;
            break;
        default:
            break;
    }
    updatePreview();
}

function playTick() {
    if (!Capacitor.isNativePlatform()) return;
    const now = Date.now();
    if (now - hapticTimer < 24) return;
    hapticTimer = now;
    Haptics.selectionChanged().catch(() => {});
}

class WheelEngine {
    constructor({ columnEl, items, index, onChange, onTick }) {
        this.el = columnEl;
        this.list = columnEl.querySelector('.dru-date-list');
        this.items = items;
        this.index = clamp(index, 0, Math.max(items.length - 1, 0));
        this.offset = -this.index * ITEM_HEIGHT;
        this.onChange = onChange;
        this.onTick = onTick;
        this.dragging = false;
        this.moved = false;
        this.raf = 0;
        this.velocity = 0;
        this.startY = 0;
        this.startOffset = 0;
        this.startTime = 0;
        this.lastY = 0;
        this.lastTime = 0;
        this.lastTick = this.index;
        this.pointerId = null;

        this.onTouchStart = this.onTouchStart.bind(this);
        this.onTouchMove = this.onTouchMove.bind(this);
        this.onTouchEnd = this.onTouchEnd.bind(this);
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.onWheel = this.onWheel.bind(this);

        this.bind();
        this.render();
        this.notify();
    }

    get minOffset() {
        return -(Math.max(this.items.length, 1) - 1) * ITEM_HEIGHT;
    }

    get maxOffset() {
        return 0;
    }

    bind() {
        this.el.addEventListener('touchstart', this.onTouchStart, { passive: true });
        this.el.addEventListener('touchmove', this.onTouchMove, { passive: false });
        this.el.addEventListener('touchend', this.onTouchEnd, { passive: true });
        this.el.addEventListener('touchcancel', this.onTouchEnd, { passive: true });
        this.el.addEventListener('mousedown', this.onMouseDown);
        this.el.addEventListener('wheel', this.onWheel, { passive: false });
    }

    destroy() {
        cancelAnimationFrame(this.raf);
        this.el.removeEventListener('touchstart', this.onTouchStart);
        this.el.removeEventListener('touchmove', this.onTouchMove);
        this.el.removeEventListener('touchend', this.onTouchEnd);
        this.el.removeEventListener('touchcancel', this.onTouchEnd);
        this.el.removeEventListener('mousedown', this.onMouseDown);
        this.el.removeEventListener('wheel', this.onWheel);
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('mouseup', this.onMouseUp);
    }

    setItems(items, index) {
        this.items = items;
        this.goTo(clamp(index, 0, Math.max(items.length - 1, 0)), false);
    }

    goTo(index, animate = true) {
        const next = clamp(index, 0, Math.max(this.items.length - 1, 0));
        const target = -next * ITEM_HEIGHT;
        if (!animate) {
            cancelAnimationFrame(this.raf);
            this.offset = target;
            this.index = next;
            this.lastTick = next;
            this.render();
            this.notify(false);
            return;
        }
        this.animateTo(target, 320);
    }

    visualIndex() {
        return clamp(Math.round(-this.offset / ITEM_HEIGHT), 0, Math.max(this.items.length - 1, 0));
    }

    snap(value) {
        const snapped = Math.round(value / ITEM_HEIGHT) * ITEM_HEIGHT;
        return clamp(snapped, this.minOffset, this.maxOffset);
    }

    resist(value) {
        if (value > this.maxOffset) {
            return this.maxOffset + (value - this.maxOffset) * 0.28;
        }
        if (value < this.minOffset) {
            return this.minOffset + (value - this.minOffset) * 0.28;
        }
        return value;
    }

    render() {
        if (!this.list) return;
        this.list.style.transform = `translate3d(0, ${this.offset + CENTER_OFFSET}px, 0)`;
        this.updateItemVisuals();

        const visual = this.visualIndex();
        if (visual !== this.lastTick) {
            this.lastTick = visual;
            this.index = visual;
            this.onTick?.();
            this.onChange?.(visual);
        }
    }

    updateItemVisuals() {
        const nodes = this.list.children;
        const center = -this.offset / ITEM_HEIGHT;
        for (let i = 0; i < nodes.length; i += 1) {
            const distance = i - center;
            const abs = Math.abs(distance);
            const node = nodes[i];
            if (abs > VISIBLE_COUNT) {
                node.style.visibility = 'hidden';
                continue;
            }
            node.style.visibility = 'visible';
            const rotateX = clamp(distance * 20, -72, 72);
            const opacity = clamp(1 - abs * 0.3, 0.16, 1);
            node.style.transform = `rotateX(${rotateX}deg)`;
            node.style.opacity = String(opacity);
            node.classList.toggle('is-active', abs < 0.5);
        }
    }

    notify() {
        this.onChange?.(this.index);
    }

    animateTo(target, duration) {
        cancelAnimationFrame(this.raf);
        const start = this.offset;
        const distance = target - start;
        if (Math.abs(distance) < 0.5 || duration <= 0) {
            this.offset = target;
            this.index = this.visualIndex();
            this.lastTick = this.index;
            this.render();
            this.notify();
            return;
        }

        const startTime = performance.now();
        const step = (now) => {
            const progress = Math.min(1, (now - startTime) / duration);
            this.offset = start + distance * easeOutQuart(progress);
            this.render();
            if (progress < 1) {
                this.raf = requestAnimationFrame(step);
            }
            else {
                this.offset = target;
                this.index = this.visualIndex();
                this.lastTick = this.index;
                this.render();
                this.notify();
            }
        };
        this.raf = requestAnimationFrame(step);
    }

    stopAnimation() {
        cancelAnimationFrame(this.raf);
    }

    beginDrag(y) {
        this.stopAnimation();
        this.dragging = true;
        this.moved = false;
        this.startY = y;
        this.lastY = y;
        this.startOffset = this.offset;
        this.startTime = Date.now();
        this.lastTime = this.startTime;
        this.velocity = 0;
    }

    moveDrag(y) {
        if (!this.dragging) return;
        const delta = y - this.startY;
        if (Math.abs(delta) > 4) this.moved = true;
        const now = Date.now();
        const dt = Math.max(now - this.lastTime, 1);
        this.velocity = (y - this.lastY) / dt;
        this.lastY = y;
        this.lastTime = now;
        this.offset = this.resist(this.startOffset + delta);
        this.render();
    }

    endDrag(event) {
        if (!this.dragging) return;
        this.dragging = false;

        if (!this.moved) {
            const targetEl = event?.target?.closest?.('.dru-date-item');
            if (targetEl && this.list) {
                const index = Array.from(this.list.children).indexOf(targetEl);
                if (index >= 0) {
                    this.animateTo(-index * ITEM_HEIGHT, 280);
                    return;
                }
            }
        }

        const duration = Date.now() - this.startTime;
        const distance = this.offset - this.startOffset;
        let target = this.offset;

        if (duration < 280 && Math.abs(distance) > 12) {
            const speed = Math.abs(this.velocity);
            target = this.offset + (speed / 0.003) * Math.sign(this.velocity || distance);
        }

        target = this.snap(target);
        const travel = Math.abs(target - this.offset);
        const animDuration = Math.min(820, Math.max(280, travel * 0.85));
        this.animateTo(target, animDuration);
    }

    onTouchStart(event) {
        this.beginDrag(event.touches[0].clientY);
    }

    onTouchMove(event) {
        if (!this.dragging) return;
        event.preventDefault();
        this.moveDrag(event.touches[0].clientY);
    }

    onTouchEnd(event) {
        this.endDrag(event);
    }

    onMouseDown(event) {
        if (event.button !== 0) return;
        this.beginDrag(event.clientY);
        document.addEventListener('mousemove', this.onMouseMove);
        document.addEventListener('mouseup', this.onMouseUp);
    }

    onMouseMove(event) {
        this.moveDrag(event.clientY);
    }

    onMouseUp(event) {
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('mouseup', this.onMouseUp);
        this.endDrag(event);
    }

    onWheel(event) {
        event.preventDefault();
        const direction = event.deltaY > 0 ? 1 : -1;
        this.goTo(this.index + direction, true);
    }
}

function setColumnRef(key, el) {
    if (el) columnEls[key] = el;
    else delete columnEls[key];
}

function destroyWheels() {
    Object.keys(wheels).forEach((key) => {
        wheels[key]?.destroy();
        delete wheels[key];
    });
}

function initWheels() {
    destroyWheels();
    columns.value.forEach((column) => {
        const el = columnEls[column.key];
        if (!el) return;
        wheels[column.key] = new WheelEngine({
            columnEl: el,
            items: column.items,
            index: columnIndex(column.key),
            onChange: (index) => setColumnIndex(column.key, index),
            onTick: playTick,
        });
    });
}

function onItemClick(key, index) {
    const wheel = wheels[key];
    if (!wheel || wheel.moved) return;
    wheel.goTo(index, true);
}

function lockScroll() {
    if (!process.client) return;
    lockedScrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${lockedScrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
}

function unlockScroll() {
    if (!process.client) return;
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.width = '';
    document.body.style.overflow = '';
    window.scrollTo(0, lockedScrollY);
}

function updateNarrow() {
    if (!process.client) return;
    isNarrow.value = window.innerWidth <= 768;
}

function updatePopoverPosition() {
    const input = inputField.value;
    if (!input || isMobileLayout.value) {
        popoverStyle.value = {};
        return;
    }

    const rect = input.getBoundingClientRect();
    const panelWidth = 300;
    const panelHeight = 310;
    const gap = 8;
    const left = clamp(rect.left, 12, window.innerWidth - panelWidth - 12);
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow > panelHeight + gap
        ? rect.bottom + gap
        : Math.max(12, rect.top - panelHeight - gap);

    popoverStyle.value = {
        top: `${top}px`,
        left: `${left}px`,
        width: `${Math.min(panelWidth, window.innerWidth - 24)}px`,
    };
}

function ensureInitialDate() {
    if (hasSetInitialDate.value) return;
    const incoming = parseIncomingDate(props.modelValue)
        || parseIncomingDate(props.birthday)
        || parseIncomingDate(props.startDate);
    if (incoming) {
        applyDate(incoming, { fillInput: false });
    }
    hasSetInitialDate.value = true;
}

async function openPicker() {
    ensureInitialDate();
    snapshot = captureState();
    isOpen.value = true;
    lockScroll();
    updatePopoverPosition();
    await nextTick();
    await nextTick();
    initWheels();
}

function closePicker() {
    destroyWheels();
    isOpen.value = false;
    unlockScroll();
}

function onInputClick() {
    if (isOpen.value) {
        if (!isMobileLayout.value) onCancel();
        return;
    }
    openPicker();
}

function onCancel() {
    restoreState(snapshot);
    closePicker();
}

function onConfirm() {
    emitDateValue();
    closePicker();
}

function onKeydown(event) {
    if (!isOpen.value) return;
    if (event.key === 'Escape') onCancel();
    if (event.key === 'Enter') onConfirm();
}

watch(days, async (items, previous) => {
    if (selectedDayIndex.value > items.length - 1) {
        selectedDayIndex.value = items.length - 1;
    }
    if (!isOpen.value) return;
    if (previous && items.length === previous.length) return;
    await nextTick();
    wheels.day?.setItems(items, selectedDayIndex.value);
});

onMounted(() => {
    updateNarrow();
    window.addEventListener('resize', updateNarrow);

    const incoming = parseIncomingDate(props.modelValue) || parseIncomingDate(props.birthday);
    if (incoming) {
        applyDate(incoming, { fillInput: true });
        hasSetInitialDate.value = true;
        emit('update:modelValue', formattedDate.value);
    }
    else {
        setCurrentDateIndices();
    }

    window.addEventListener('keydown', onKeydown);
});

onBeforeUnmount(() => {
    destroyWheels();
    if (isOpen.value) unlockScroll();
    window.removeEventListener('resize', updateNarrow);
    window.removeEventListener('keydown', onKeydown);
});
</script>

<style lang="scss" scoped>
.datepicker-parent-wrapper {
    position: relative;
}

.dateInput {
    width: 100%;
    padding: 12px;
    font-size: 16px;
    border-radius: 8px;
    border: 1px solid #ddd;
    background: url("~/assets/images/icons/icon-calendar.svg") no-repeat right 14px top 50% $white;
    background-size: 20px 20px;
    color: #333;
    box-sizing: border-box;
    caret-color: transparent;
}
</style>

<style lang="scss">
.dru-date-root {
    position: fixed;
    inset: 0;
    z-index: 10050;
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif;
    overscroll-behavior: none;
}

.dru-date-root,
.dru-date-root * {
    touch-action: none;
}

.dru-date-backdrop {
    position: absolute;
    inset: 0;
    background: rgba(24, 34, 48, 0.36);
    animation: dru-date-fade-in 0.28s ease;
}

.dru-date-root.is-desktop .dru-date-backdrop {
    background: transparent;
}

.dru-date-panel {
    background: $white;
    overflow: hidden;
}

.dru-date-panel--sheet {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 16px 16px 0 0;
    padding-bottom: max(12px, env(safe-area-inset-bottom, 0px));
    box-shadow: 0 -8px 32px rgba(24, 34, 48, 0.12);
    animation: dru-date-sheet-in 0.36s cubic-bezier(0.32, 0.72, 0, 1);
}

.dru-date-panel--popover {
    position: absolute;
    border-radius: 16px;
    border: 1px solid $lighter-gray;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
    animation: dru-date-popover-in 0.2s ease;
}

.dru-date-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 44px;
    padding: 2px 8px 2px 4px;
    border-bottom: 1px solid $border-section-color;
}

.dru-date-title {
    color: $primary-purple;
    font-size: 15px;
    font-weight: 600;
}

.dru-date-btn {
    appearance: none;
    background: none;
    border: none;
    color: $primary-purple;
    font-size: 17px;
    line-height: 22px;
    padding: 10px 12px;
    font-weight: 400;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
}

.dru-date-btn--done {
    font-weight: 600;
}

.dru-date-wheels {
    position: relative;
    display: flex;
    height: 252px;
    overflow: hidden;
    touch-action: none;
    -webkit-mask-image: linear-gradient(
        to bottom,
        transparent 0%,
        #000 18%,
        #000 82%,
        transparent 100%
    );
    mask-image: linear-gradient(
        to bottom,
        transparent 0%,
        #000 18%,
        #000 82%,
        transparent 100%
    );
}

.dru-date-highlight {
    position: absolute;
    left: 12px;
    right: 12px;
    top: 50%;
    height: 36px;
    margin-top: -18px;
    background: rgba(78, 22, 156, 0.08);
    border-radius: 8px;
    pointer-events: none;
    z-index: 0;
}

.dru-date-column {
    position: relative;
    z-index: 1;
    flex: 1;
    height: 252px;
    overflow: hidden;
    perspective: 1200px;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
    cursor: grab;
}

.dru-date-column:active {
    cursor: grabbing;
}

.month-column {
    flex: 1.45;
}

.day-column,
.year-column,
.hour-column,
.minute-column {
    flex: 0.9;
}

.dru-date-list {
    margin: 0;
    padding: 0;
    list-style: none;
    transform-style: preserve-3d;
    will-change: transform;
}

.dru-date-item {
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    line-height: 36px;
    font-weight: 400;
    color: $secondary-gray;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    transform-origin: center center;
}

.dru-date-item.is-active {
    color: $primary-purple;
    font-weight: 600;
}

@keyframes dru-date-fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes dru-date-sheet-in {
    from { transform: translate3d(0, 100%, 0); }
    to { transform: translate3d(0, 0, 0); }
}

@keyframes dru-date-popover-in {
    from {
        opacity: 0;
        transform: translateY(-8px) scale(0.98);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}
</style>
