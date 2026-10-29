# dru-date-picker

Lightweight **iOS-style wheel date picker** for JavaScript. Scroll date, time, or datetime on touch-friendly wheels — in **Vue 3**, **React**, **Next.js**, **Nuxt 3**, or vanilla JS.

This is a custom wheel UI inspired by iPhone, not the native iOS `UIDatePicker`.

[![npm version](https://img.shields.io/npm/v/dru-date-picker.svg)](https://www.npmjs.com/package/dru-date-picker)
[![npm downloads](https://img.shields.io/npm/dm/dru-date-picker.svg)](https://www.npmjs.com/package/dru-date-picker)
[![bundle size](https://img.shields.io/bundlephobia/minzip/dru-date-picker)](https://bundlephobia.com/package/dru-date-picker)
[![license](https://img.shields.io/npm/l/dru-date-picker.svg)](./LICENSE)

<p align="center">
  <img src="https://raw.githubusercontent.com/drusba/dru-date-picker/main/docs/demo.gif" alt="iOS-style JavaScript wheel date picker selecting a date on a mobile sheet" width="360" />
</p>

**npm:** [dru-date-picker](https://www.npmjs.com/package/dru-date-picker) · **GitHub:** [drusba/dru-date-picker](https://github.com/drusba/dru-date-picker)

## Features

- iOS-style scrolling wheels for date, datetime, time, and year-month
- Touch-friendly on mobile; popover on desktop
- Per-instance colors, button text, locale, and date bounds
- Web component at the core — same API from vanilla JS or a framework wrapper
- About 9 kB gzipped (plus [dayjs](https://www.npmjs.com/package/dayjs))

## Install

```bash
npm install dru-date-picker
```

Styles inject when the picker mounts. Import them yourself only if you need the CSS loaded up front:

```js
import 'dru-date-picker/style.css'
```

## Quick start

```js
import { createDatePicker } from 'dru-date-picker'

const picker = createDatePicker('#dob', {
  mode: 'date',
  format: 'DD-MM-YYYY',
  minYear: 'now-120',
  maxYear: 'now',
  confirmText: 'Set Date',
  cancelText: 'Close',
  accentColor: '#4e169c',
})

picker.on('change', (event) => {
  console.log(event.detail.value, event.detail.date, event.detail.iso)
})
```

Or the custom element after importing the package:

```html
<dru-date-picker
  mode="datetime"
  min-year="now"
  max-year="now+5"
  confirm-text="Done"
  cancel-text="Cancel"
></dru-date-picker>
```

### Local demo

```bash
npm install
npm run dev
```

## Customization

| Option | Default | What it does |
| --- | --- | --- |
| `mode` | `'date'` | `'date'`, `'datetime'`, `'time'`, or `'year-month'` |
| `format` | depends on mode | Display format, e.g. `DD-MM-YYYY` or `DD-MM-YYYY HH:mm` |
| `valueFormat` | depends on mode | Value emitted on confirm |
| `confirmText` | `Set Date` | Right toolbar button |
| `cancelText` | `Close` | Left toolbar button |
| `label` | `''` | Toolbar title |
| `placeholder` | `Select Date` | Input placeholder |
| `locale` | `en` | Month names via `Intl` |
| `months` | from locale | Override the 12 month labels |
| `minYear` / `maxYear` | `1920` / `now` | Year wheel bounds. Number, `'now'`, or `'now-120'` / `'now+5'` |
| `minYearOffset` / `maxYearOffset` | — | Offset from the current year, e.g. `-100` and `5` |
| `minDate` / `maxDate` | — | Optional date bounds |
| `accentColor` | `#4e169c` | Buttons, title, selected item |
| `textColor` | `#333333` | Input text |
| `mutedColor` | `#6b7280` | Unselected wheel items |
| `panelBackground` | `#ffffff` | Panel and input |
| `highlightColor` | `rgba(78, 22, 156, 0.08)` | Center highlight |
| `backdropColor` | `rgba(24, 34, 48, 0.36)` | Mobile sheet overlay |
| `borderColor` | `#e5e7eb` | Borders |
| `disabled` | `false` | Disable the input |
| `onTick` | — | Called when a wheel item crosses the center (haptics) |

CSS variables on the host:

```css
dru-date-picker {
  --dru-accent: #0ea5e9;
  --dru-highlight: rgba(14, 165, 233, 0.12);
}
```

Year bounds resolve when the picker opens, so `'now'` is always the current year:

```js
minYear: 'now-120'   // birthday
maxYear: 'now'

minYear: 'now'       // booking
maxYear: 'now+5'

minYearOffset: -120  // 18+
maxYearOffset: -18

minYear: 2000        // fixed range
maxYear: 2030
```

```html
<dru-date-picker min-year="now-100" max-year="now+2"></dru-date-picker>
```

Legacy props from the original Vue component still work: `showTime`, `formatToShow`, `formatToResponse`, `confirmLabel`, `birthday`, `startDate`.

## Vue 3

```js
import { createApp } from 'vue'
import DruDatePicker from 'dru-date-picker/vue'

const app = createApp(App)
app.use(DruDatePicker)
```

```html
<DruDatePicker
  v-model="date"
  mode="datetime"
  format="DD-MM-YYYY HH:mm"
  min-year="now"
  max-year="now+5"
  confirm-text="Done"
  cancel-text="Cancel"
  accent-color="#0ea5e9"
/>
```

Or import the component:

```js
import { DruDatePicker } from 'dru-date-picker/vue'
```

## Nuxt 3

```js
export default defineNuxtConfig({
  modules: ['dru-date-picker/nuxt'],
})
```

Then use `<DruDatePicker v-model="date" mode="date" />` in any page.

## React

```jsx
import { useState } from 'react'
import { DruDatePicker } from 'dru-date-picker/react'

export function Example() {
  const [date, setDate] = useState('')

  return (
    <DruDatePicker
      value={date}
      onChange={setDate}
      mode="date"
      minYear="now-120"
      maxYear="now"
      confirmText="Save"
      cancelText="Close"
      accentColor="#4e169c"
    />
  )
}
```

## Next.js

Import from the Next entry so the picker mounts only in the browser. That avoids App Router / SSR errors with the custom element.

```jsx
'use client'

import { useState } from 'react'
import { DruDatePicker } from 'dru-date-picker/next'

export default function BirthdayField() {
  const [date, setDate] = useState('')

  return (
    <DruDatePicker
      value={date}
      onChange={setDate}
      mode="date"
      minYear="now-120"
      maxYear="now"
      confirmText="Set Date"
      cancelText="Close"
      accentColor="#4e169c"
    />
  )
}
```

Works with the App Router and the Pages Router. Import it from a Client Component, or keep `'use client'` on the file that renders it.

## API

`createDatePicker(target, options)` returns:

| Method / property | Description |
| --- | --- |
| `value` | Current display value |
| `open()` | Open the wheel panel |
| `close()` | Close without confirming |
| `setYearBounds(min, max)` | Update year wheels without recreating the picker |
| `on(event, handler)` | Subscribe; returns an unsubscribe function |
| `destroy()` | Remove the picker from the DOM |
| `el` | The `dru-date-picker` element |

### Events

| Event | Detail |
| --- | --- |
| `change` | `{ value, date, iso }` after confirm |
| `confirm` | same payload |
| `cancel` | — |
| `open` | — |
| `close` | — |

## Keyboard

- Click or Enter on the input opens the picker
- `Escape` cancels
- `Enter` (while open) confirms

Wheels are primarily drag / scroll. This is not a native iOS control and does not yet expose a full ARIA listbox.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| Next.js / SSR error about `window` or custom elements | Import from `dru-date-picker/next` inside a Client Component |
| Picker looks unstyled | `import 'dru-date-picker/style.css'` |
| Target not found | `createDatePicker` needs a CSS selector or DOM node that already exists |
| Months stay in English | Set `locale` (e.g. `'es'`) or pass `months` |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

[MIT](./LICENSE)
