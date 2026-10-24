export const ITEM_HEIGHT = 36;
export const VISIBLE_COUNT = 7;
export const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE_COUNT;
export const CENTER_OFFSET = (WHEEL_HEIGHT - ITEM_HEIGHT) / 2;
export const MOBILE_BREAKPOINT = 768;
export const ELEMENT_TAG = 'dru-date-picker';

export const MODES = ['date', 'datetime', 'time', 'year-month'];

export const COLOR_VARS = {
    accentColor: '--dru-accent',
    textColor: '--dru-text',
    mutedColor: '--dru-muted',
    panelBackground: '--dru-panel-bg',
    highlightColor: '--dru-highlight',
    backdropColor: '--dru-backdrop',
    borderColor: '--dru-border',
};

export const DEFAULT_COLORS = {
    accentColor: '#4e169c',
    textColor: '#333333',
    mutedColor: '#6b7280',
    panelBackground: '#ffffff',
    highlightColor: 'rgba(78, 22, 156, 0.08)',
    backdropColor: 'rgba(24, 34, 48, 0.36)',
    borderColor: '#e5e7eb',
};

export const PARSE_FORMATS = [
    'YYYY-MM-DD HH:mm',
    'YYYY-MM-DD',
    'YYYY-MM',
    'HH:mm',
    'MM-DD-YYYY',
    'DD-MM-YYYY',
    'MM/DD/YYYY',
    'DD/MM/YYYY',
    'YYYY/MM/DD',
];

export const OPTION_KEYS = [
    'value',
    'mode',
    'format',
    'valueFormat',
    'minYear',
    'maxYear',
    'minYearOffset',
    'maxYearOffset',
    'minDate',
    'maxDate',
    'label',
    'placeholder',
    'confirmText',
    'cancelText',
    'locale',
    'months',
    'id',
    'name',
    'disabled',
    'startDate',
    'birthday',
    'onTick',
    ...Object.keys(COLOR_VARS),
];

export const ATTR_TO_PROP = {
    value: 'value',
    mode: 'mode',
    format: 'format',
    'value-format': 'valueFormat',
    'min-year': 'minYear',
    'max-year': 'maxYear',
    'min-year-offset': 'minYearOffset',
    'max-year-offset': 'maxYearOffset',
    'min-date': 'minDate',
    'max-date': 'maxDate',
    label: 'label',
    placeholder: 'placeholder',
    'confirm-text': 'confirmText',
    'cancel-text': 'cancelText',
    locale: 'locale',
    id: 'id',
    name: 'name',
    disabled: 'disabled',
    'start-date': 'startDate',
    birthday: 'birthday',
    'accent-color': 'accentColor',
    'text-color': 'textColor',
    'muted-color': 'mutedColor',
    'panel-background': 'panelBackground',
    'highlight-color': 'highlightColor',
    'backdrop-color': 'backdropColor',
    'border-color': 'borderColor',
    // Legacy aliases from the original Vue component
    'show-time': 'showTime',
    'format-to-show': 'format',
    'format-to-response': 'valueFormat',
    'confirm-label': 'confirmText',
};
