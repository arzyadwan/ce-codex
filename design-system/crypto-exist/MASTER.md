# Crypto Exist Design System

Sumber kebenaran visual global. Override halaman berada pada `pages/<page>.md`.

## Arah

- Media berita dan edukasi kripto.
- Editorial technology, Swiss minimalism, content-first, high contrast.
- Variance 6/10; motion 3/10; density 6/10.
- Mengadaptasi struktur `UI.png`, bukan menyalin pixel-perfect.

## Tokens

```css
:root {
  --brand: #fff200; --brand-foreground: #0a0a0a;
  --background: #f6f5f2; --foreground: #18181b;
  --surface: #ffffff; --surface-muted: #eeece7;
  --muted-foreground: #52525b; --border: #d8d6d1;
  --header: #0a0a0a; --header-muted: #1c1b1a;
  --breaking: #c81e1e; --success: #147a4b; --ring: #fff200;
  --radius-sm: .375rem; --radius-md: .75rem; --radius-lg: 1rem;
}
.dark {
  --background: #0a0a0a; --foreground: #f5f5f4;
  --surface: #171614; --surface-muted: #242220;
  --muted-foreground: #c4c1bb; --border: #3b3935;
}
```

## Aturan

- Heading: Newsreader 500–700; body/UI: Inter 400–700.
- Mobile-first pada 375, 768, 1024, dan 1440px; container maksimum 1280px.
- Desktop home memakai content 8 kolom + sidebar 4 kolom; mobile satu kolom.
- Header gelap, hero berita 16:9, kartu artikel stabil, sidebar mengalir setelah konten pada mobile.
- Tombol utama kuning dengan teks hitam; focus ring 2–4px terlihat.
- Hover/focus 150–250ms dan tidak mengubah layout; hormati `prefers-reduced-motion`.
- Dilarang memakai neon/glow berlebihan, gaya kasino, urgency palsu, emoji sebagai ikon, contrast rendah, dan carousel autoplay tanpa kontrol.
