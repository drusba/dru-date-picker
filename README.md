# dru-date-picker

iOS-style wheel date/time picker for **Vue 3**, **React**, **Nuxt 3**, and **vanilla JavaScript**.

Every instance can set its own **colors**, **button text**, and **date type**.

## Install

```bash
npm install dru-date-picker
```

Import styles once if you are not using the JS entry that injects them automatically:

```js
import 'dru-date-picker/style.css'
```

The web component also injects the CSS the first time it mounts, so a separate import is optional.

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
| `minYear` / `maxYear` | `1920` / current year | Year wheel bounds |
| `minDate` / `maxDate` | — | Optional date bounds |
| `accentColor` | `#4e169c` | Buttons, title, selected item |
| `textColor` | `#333333` | Input text |
| `mutedColor` | `#6b7280` | Unselected wheel items |
| `panelBackground` | `#ffffff` | Panel and input |
| `highlightColor` | `rgba(78, 22, 156, 0.08)` | Center highlight |
| `backdropColor` | `rgba(24, 34, 48, 0.36)` | Mobile sheet overlay |
| `borderColor` | `#e5e7eb` | Borders |

You can also set the same colors with CSS variables on the host:

```css
dru-date-picker {
  --dru-accent: #0ea5e9;
  --dru-highlight: rgba(14, 165, 233, 0.12);
}
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
  confirm-text="Done"
  cancel-text="Cancel"
  accent-color="#0ea5e9"
/>
```

Or import the component directly:

```js
import { DruDatePicker } from 'dru-date-picker/vue'
```

## Nuxt 3

```js
export default defineNuxtConfig({
  modules: ['dru-date-picker/nuxt'],
})
```

Then use `<DruDatePicker v-model="date" mode="date" />` in any page or component.

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
      confirmText="Save"
      cancelText="Close"
      accentColor="#4e169c"
    />
  )
}
```

## Vanilla JavaScript

```js
import { createDatePicker } from 'dru-date-picker'

const picker = createDatePicker('#dob', {
  mode: 'date',
  format: 'DD-MM-YYYY',
  confirmText: 'Save',
  cancelText: 'Close',
  accentColor: '#4e169c',
})

picker.on('change', (event) => {
  console.log(event.detail.value, event.detail.date)
})
```

You can also drop the custom element in HTML after importing the package:

```html
<dru-date-picker
  mode="time"
  confirm-text="Save time"
  cancel-text="Back"
  accent-color="#c2410c"
></dru-date-picker>
```

## Events

- `change` — `{ value, date, iso }` after confirm
- `confirm` — same payload
- `cancel`
- `open`
- `close`

`onTick` is an optional callback fired as a wheel item crosses the center. Use it for haptics or other native feedback.

## Local demo

```bash
npm install
npm run dev
```

## License

MIT
