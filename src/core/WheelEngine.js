import { CENTER_OFFSET, ITEM_HEIGHT, VISIBLE_COUNT } from './constants.js';
import { clamp, easeOutQuart } from './dates.js';

export class WheelEngine {
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
