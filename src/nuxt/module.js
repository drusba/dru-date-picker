import { addComponent, addPlugin, createResolver, defineNuxtModule } from '@nuxt/kit';

export default defineNuxtModule({
    meta: {
        name: 'dru-date-picker',
        configKey: 'druDatePicker',
        compatibility: {
            nuxt: '>=3.0.0',
        },
    },
    defaults: {},
    setup() {
        const resolver = createResolver(import.meta.url);
        addPlugin({
            src: resolver.resolve('./plugin.js'),
            mode: 'client',
        });
        addComponent({
            name: 'DruDatePicker',
            filePath: resolver.resolve('../vue/index.js'),
            export: 'DruDatePicker',
        });
    },
});
