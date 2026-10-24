import { defineNuxtPlugin } from '#app';
import { plugin } from '../vue/index.js';

export default defineNuxtPlugin((nuxtApp) => {
    nuxtApp.vueApp.use(plugin);
});
