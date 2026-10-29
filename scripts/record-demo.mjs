import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const rootDir = dirname(fileURLToPath(import.meta.url));
const rawDir = join(rootDir, '../docs/video-raw');
mkdirSync(rawDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
    viewport: { width: 420, height: 860 },
    deviceScaleFactor: 2,
    recordVideo: {
        dir: rawDir,
        size: { width: 420, height: 860 },
    },
});

const page = await context.newPage();
await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(900);

await page.getByPlaceholder('Select birthday').click();
await page.waitForTimeout(1400);
await page.getByRole('button', { name: 'Set Date' }).click();
await page.waitForTimeout(700);

await page.getByPlaceholder('Pick date and time').click();
await page.waitForTimeout(1500);
await page.getByRole('button', { name: 'Done' }).click();
await page.waitForTimeout(700);

await page.getByPlaceholder('Select time').click();
await page.waitForTimeout(1300);
await page.getByRole('button', { name: 'Save time' }).click();
await page.waitForTimeout(800);

const video = page.video();
await context.close();
const videoPath = await video?.path();
await browser.close();
console.log(videoPath || 'recorded');
