export type DatePickerMode = 'date' | 'datetime' | 'time' | 'year-month';

export interface DatePickerChangeDetail {
    value: string;
    date: string;
    iso: string;
}

export interface DatePickerOptions {
    value?: string;
    mode?: DatePickerMode;
    format?: string;
    valueFormat?: string;
    minYear?: number | string;
    maxYear?: number | string;
    minYearOffset?: number;
    maxYearOffset?: number;
    minDate?: string;
    maxDate?: string;
    label?: string;
    placeholder?: string;
    confirmText?: string;
    cancelText?: string;
    locale?: string;
    months?: string[];
    id?: string;
    name?: string;
    disabled?: boolean;
    startDate?: string;
    birthday?: string;
    onTick?: () => void;
    accentColor?: string;
    textColor?: string;
    mutedColor?: string;
    panelBackground?: string;
    highlightColor?: string;
    backdropColor?: string;
    borderColor?: string;
    showTime?: boolean;
    formatToShow?: string;
    formatToResponse?: string;
    confirmLabel?: string;
}

export interface DatePickerInstance {
    el: HTMLElement;
    value: string;
    open(): Promise<void> | void;
    close(): void;
    setYearBounds(minYear?: number | string, maxYear?: number | string): void;
    on(eventName: string, handler: EventListener): () => void;
    destroy(): void;
}

export declare class DruDatePickerElement extends HTMLElement {
    value: string;
    mode: DatePickerMode;
    format: string;
    valueFormat: string;
    minYear: number | string;
    maxYear: number | string;
    minYearOffset: number;
    maxYearOffset: number;
    minDate: string;
    maxDate: string;
    label: string;
    placeholder: string;
    confirmText: string;
    cancelText: string;
    locale: string;
    months: string[];
    disabled: boolean;
    accentColor: string;
    textColor: string;
    mutedColor: string;
    panelBackground: string;
    highlightColor: string;
    backdropColor: string;
    borderColor: string;
    open(): Promise<void>;
    close(): void;
}

export function register(tag?: string): string;
export function createDatePicker(target: string | Element, options?: DatePickerOptions): DatePickerInstance;

declare const DruDatePickerDefault: {
    createDatePicker: typeof createDatePicker;
    register: typeof register;
    DruDatePickerElement: typeof DruDatePickerElement;
};

export default DruDatePickerDefault;

declare module 'dru-date-picker/vue' {
    import type { Plugin, DefineComponent } from 'vue';
    import type { DatePickerOptions } from 'dru-date-picker';

    export const DruDatePicker: DefineComponent<DatePickerOptions & { modelValue?: string }>;
    export const plugin: Plugin;
    const defaultPlugin: Plugin;
    export default defaultPlugin;
}

declare module 'dru-date-picker/react' {
    import type { CSSProperties, ForwardRefExoticComponent, RefAttributes } from 'react';
    import type { DatePickerChangeDetail, DatePickerInstance, DatePickerOptions } from 'dru-date-picker';

    export interface DruDatePickerProps extends DatePickerOptions {
        className?: string;
        style?: CSSProperties;
        onChange?: (value: string, detail: DatePickerChangeDetail, event: Event) => void;
        onConfirm?: (detail: DatePickerChangeDetail, event: Event) => void;
        onCancel?: (detail: unknown, event: Event) => void;
        onOpen?: (detail: unknown, event: Event) => void;
        onClose?: (detail: unknown, event: Event) => void;
    }

    export const DruDatePicker: ForwardRefExoticComponent<DruDatePickerProps & RefAttributes<DatePickerInstance>>;
    export default DruDatePicker;
}

declare module 'dru-date-picker/next' {
    export { DruDatePicker, default } from 'dru-date-picker/react';
}

declare module 'dru-date-picker/nuxt' {
    import type { NuxtModule } from '@nuxt/schema';
    const module: NuxtModule;
    export default module;
}

export {};
