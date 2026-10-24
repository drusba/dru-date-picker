import React, { useEffect, useRef, useState } from 'react';
import { OPTION_KEYS } from '../core/constants.js';
import { applyOptionsToElement, register } from '../element/DruDatePicker.js';

function pickOptions(props) {
    const options = {};
    OPTION_KEYS.forEach((key) => {
        if (props[key] !== undefined) options[key] = props[key];
    });
    if (props.value !== undefined) options.value = props.value;
    if (props.showTime !== undefined) options.showTime = props.showTime;
    if (props.formatToShow !== undefined) options.format = props.formatToShow;
    if (props.formatToResponse !== undefined) options.valueFormat = props.formatToResponse;
    if (props.confirmLabel !== undefined) options.confirmText = props.confirmLabel;
    return options;
}

export const DruDatePicker = React.forwardRef(function DruDatePicker(props, forwardedRef) {
    const innerRef = useRef(null);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        register();
        setIsClient(true);
    }, []);

    useEffect(() => {
        const el = innerRef.current;
        if (!el) return undefined;

        applyOptionsToElement(el, pickOptions(props));

        const onChange = (event) => {
            props.onChange?.(event.detail?.value ?? '', event.detail, event);
        };
        const onConfirm = (event) => props.onConfirm?.(event.detail, event);
        const onCancel = (event) => props.onCancel?.(event.detail, event);
        const onOpen = (event) => props.onOpen?.(event.detail, event);
        const onClose = (event) => props.onClose?.(event.detail, event);

        el.addEventListener('change', onChange);
        el.addEventListener('confirm', onConfirm);
        el.addEventListener('cancel', onCancel);
        el.addEventListener('open', onOpen);
        el.addEventListener('close', onClose);

        return () => {
            el.removeEventListener('change', onChange);
            el.removeEventListener('confirm', onConfirm);
            el.removeEventListener('cancel', onCancel);
            el.removeEventListener('open', onOpen);
            el.removeEventListener('close', onClose);
        };
    });

    useEffect(() => {
        if (!forwardedRef) return;
        const api = {
            el: innerRef.current,
            open: () => innerRef.current?.open(),
            close: () => innerRef.current?.close(),
        };
        if (typeof forwardedRef === 'function') forwardedRef(api);
        else forwardedRef.current = api;
    });

    if (!isClient) {
        return React.createElement('input', {
            className: props.className || 'form-control dateInput',
            style: props.style,
            readOnly: true,
            placeholder: props.placeholder || props.name || 'Select Date',
            value: props.value || '',
            disabled: props.disabled,
        });
    }

    return React.createElement('dru-date-picker', {
        ref: innerRef,
        className: props.className,
        style: props.style,
    });
});

export default DruDatePicker;
