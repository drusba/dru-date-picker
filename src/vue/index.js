import { defineComponent, h, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { OPTION_KEYS } from '../core/constants.js';
import { applyOptionsToElement, register } from '../element/DruDatePicker.js';

const propDefs = OPTION_KEYS.reduce((props, key) => {
    props[key] = { default: undefined };
    return props;
}, {
    modelValue: { type: String, default: '' },
    showTime: { type: Boolean, default: undefined },
    formatToShow: { type: String, default: undefined },
    formatToResponse: { type: String, default: undefined },
    confirmLabel: { type: String, default: undefined },
});

export const DruDatePicker = defineComponent({
    name: 'DruDatePicker',
    inheritAttrs: false,
    props: propDefs,
    emits: ['update:modelValue', 'change', 'confirm', 'cancel', 'open', 'close'],
    setup(props, { emit, attrs, expose }) {
        const elRef = ref(null);
        const isClient = ref(false);

        const optionSource = () => ({
            ...props,
            value: props.modelValue || props.value,
        });

        const bindEvents = (el) => {
            const onChange = (event) => {
                const value = event.detail?.value ?? '';
                emit('update:modelValue', value);
                emit('change', event.detail);
            };
            const onConfirm = (event) => emit('confirm', event.detail);
            const onCancel = (event) => emit('cancel', event.detail);
            const onOpen = (event) => emit('open', event.detail);
            const onClose = (event) => emit('close', event.detail);

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
        };

        let unbind = null;

        onMounted(() => {
            register();
            isClient.value = true;
            requestAnimationFrame(() => {
                const el = elRef.value;
                if (!el) return;
                applyOptionsToElement(el, optionSource());
                unbind = bindEvents(el);
            });
        });

        onBeforeUnmount(() => unbind?.());

        watch(
            () => optionSource(),
            (next) => {
                if (elRef.value) applyOptionsToElement(elRef.value, next);
            },
            { deep: true },
        );

        expose({
            open: () => elRef.value?.open(),
            close: () => elRef.value?.close(),
            el: elRef,
        });

        return () => {
            if (!isClient.value) {
                return h('input', {
                    class: 'form-control dateInput',
                    readonly: true,
                    placeholder: props.placeholder || props.name || 'Select Date',
                    value: props.modelValue || props.value || '',
                    disabled: props.disabled,
                });
            }

            return h('dru-date-picker', {
                ref: elRef,
                class: attrs.class,
                style: attrs.style,
            });
        };
    },
});

export const plugin = {
    install(app) {
        register();
        app.component('DruDatePicker', DruDatePicker);
    },
};

export default plugin;
