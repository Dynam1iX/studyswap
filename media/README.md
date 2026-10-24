# Media of the StudySwap prototype

Source files and the tools that made them. What the site serves is in `public/`.

## Inventory (Assignment 4, Part B1)

| # | Asset | Where it is used | Format | Resolution / duration | File size | Source | Licence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | App logo (`StudySwapLogo.svg`) | Header, browser tab, Login | SVG | Vector | 1.1 KB | Own work (Figma) | Own |
| 2 | Navigation icons (`home`, `search`, `like`, `profile`… `.svg`) | Bottom bar, cards | SVG | Vector, 24 px grid | 0.4–1.1 KB each | Own work (Figma) | Own |
| 3 | Interface icons (lucide-react) | Buttons, settings, help | SVG (inline, from the npm package) | Vector | in the JS bundle | lucide.dev | ISC |
| 4 | Interface sounds (`public/sounds/*.mp3`) | Like, publish, Telegram linked, error | MP3, 64 kbps, mono, 44.1 kHz | 0.14–0.9 s | 1.7–7.8 KB each | Own work: synthesised with ffmpeg (`sounds/*.wav` are the masters) | Own |
| 5 | How-to video (`how-to-create.webm` / `.mp4`) | "How it works" (? in the header) | WebM VP9 / MP4 H.264, no audio | 1280 × 720, 30 fps, 32 s | 615 KB / 770 KB | Own work: recorded from the running app with demo data (`help/record.js`) | Own |
| 6 | Video poster (`how-to-create-poster.webp`) | Before the video plays | WebP q78 | 960 × 540 | 30 KB | Own work: last frame of the video | Own |
| 7 | Step screenshots (`step-*-200/400.webp`) | "How it works", three steps | WebP q80, 200 w and 400 w (`srcset`) | 400 × 558 max | 5.6–17 KB each | Own work: screenshots of the app with demo data (`help/shots.js`) | Own |
| 8 | Profile photos | Cards, Profile | WebP (JPEG fallback), cropped by the site | 256 × 256 | ~10–25 KB | Uploaded by each student | The student's own |
| 9 | Fonts: Bricolage Grotesque, Montserrat | All text | WOFF2 (Google Fonts) | — | — | Google Fonts | SIL Open Font License 1.1 |

Demo data only: the video and the screenshots show "Demo Student A…F" and a test account, no real students.

## Sounds

`sounds/*.wav` are the masters (44.1 kHz, mono), made with ffmpeg's `aevalsrc` (sine tones with an
exponential fade; see the commit "Interface sounds…"). The site serves MP3 64 kbps:
`ffmpeg -i like.wav -c:a libmp3lame -b:a 64k like.mp3`.

Every sound has a visual twin and only follows the student's own action; it can be switched off in
Profile → Settings → Sounds or on the Login page.

## How-to video and screenshots

`help/record.js` drives the real app in Chromium (Playwright) with demo data, draws the cursor, the
click ripples and the step captions, and records a 1000 × 563 window (desktop layout, larger text);
ffmpeg scales it to 1280 × 720. Then:

```bash
ffmpeg -ss 1 -i raw.webm -an -r 30 -vf scale=1280:720:flags=lanczos -c:v libx264 -preset veryfast -crf 26 -pix_fmt yuv420p -movflags +faststart how-to-create.mp4
ffmpeg -ss 1 -i raw.webm -an -r 30 -vf scale=1280:720:flags=lanczos -c:v libvpx-vp9 -crf 45 -b:v 0 how-to-create.webm
ffmpeg -i step-1-find.png -vf scale=400:-1 -c:v libwebp -quality 80 step-1-find-400.webp
```

`help/*.png` are the 2× PNG masters (860 × 1200) — the "before" state measured in Part B2.
