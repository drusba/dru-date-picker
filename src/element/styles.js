import css from '../styles/picker.css?inline';

let injected = false;

export function ensureStyles() {
    if (injected || typeof document === 'undefined') return;
    injected = true;
    const style = document.createElement('style');
    style.setAttribute('data-dru-date-picker', '');
    style.textContent = css;
    document.head.appendChild(style);
}
