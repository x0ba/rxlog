# Philosophy

## Design Language

### Philosophy
Brutalist, typographic, minimal. The design should feel bold and direct—like a poster, not a dashboard. Prioritize clarity over decoration. Let typography and whitespace do the heavy lifting.

### Color Palette

All colors are defined as CSS custom properties using OKLCH in `src/styles/app.css`.

#### Core Colors
| Token | Light Mode | Description |
|---|---|---|
| `--background` | Warm cream (`oklch(0.975 0.008 80)`) | Page background — warm off-white, not sterile |
| `--foreground` | Deep warm black (`oklch(0.16 0.01 50)`) | Primary text |
| `--card` | Lighter cream (`oklch(0.985 0.006 80)`) | Card surfaces |
| `--muted` | Warm sand (`oklch(0.94 0.01 80)`) | Subdued backgrounds |
| `--muted-foreground` | Warm gray (`oklch(0.50 0.02 50)`) | Secondary text |

#### Brand Colors
| Token | Value | Usage |
|---|---|---|
| `--primary` | Deep teal (`oklch(0.40 0.1 170)`) | Header bar, active tabs, primary actions, avatar backgrounds |
| `--accent` | Terracotta/rust (`oklch(0.60 0.16 35)`) | Warm accent for CTA highlights, patient avatars, emphasis |

#### Status Colors (semantic, not from tokens)
| Status | Color | Example |
|---|---|---|
| Taken/On-time | `emerald-500`–`700` | Green status dots, badges, stats |
| Late | `amber-500`–`700` | Yellow/amber badges and stats |
| Missed | `red-500`–`700` | Red badges, alerts, stats |
| Pending | `--border` / `--muted` | Neutral, waiting state |

#### Dark Mode Colors

Dark mode is available in authed layouts. Toggle via the sun/moon button in the header bar. Preference is persisted to `localStorage` and falls back to system preference.

| Token | Dark Mode | Description |
|---|---|---|
| `--background` | Deep charcoal (`oklch(0.14 0.008 60)`) | Page background — warm dark, not pure black |
| `--foreground` | Warm off-white (`oklch(0.92 0.008 80)`) | Primary text |
| `--card` | Slightly lifted charcoal (`oklch(0.18 0.01 60)`) | Card surfaces |
| `--muted` | Dark warm gray (`oklch(0.22 0.01 60)`) | Subdued backgrounds |
| `--muted-foreground` | Muted warm gray (`oklch(0.62 0.012 60)`) | Secondary text |
| `--primary` | Lighter teal (`oklch(0.55 0.11 170)`) | Header bar, active tabs, primary actions |
| `--primary-foreground` | Near-white (`oklch(0.96 0.006 80)`) | Text on primary surfaces |
| `--accent` | Bright terracotta (`oklch(0.62 0.15 35)`) | CTA highlights, emphasis — slightly lifted for dark bg |
| `--accent-foreground` | Near-white (`oklch(0.96 0.006 80)`) | Text on accent surfaces |
| `--border` | White at 12% opacity (`oklch(1 0 0 / 12%)`) | Subtle light edges on dark surfaces |
| `--destructive` | Warm red (`oklch(0.65 0.20 25)`) | Error states, destructive actions |

Dark mode status badges use `-950` backgrounds with `-200` text and `-800` borders (e.g. `bg-emerald-950 text-emerald-200 border-emerald-800`). Brutalist shadows shift to pure black at reduced opacity for depth without harshness.

#### Border Convention
Use `border-foreground/80` for strong structural borders (cards, nav, dividers) and `border-border` for subtle/secondary borders. Avoid hardcoded hex values like `#1a1a1a` — always use tokens.

### Typography
- **Font**: DM Sans Variable (via `@fontsource-variable/dm-sans`)
- **Headings**: Font-black (900 weight), tight tracking
- **Body**: Regular weight, clean and readable
- **Monospace**: For technical info, timestamps, stats
- Use size contrast dramatically—massive headlines with small supporting text

### Borders & Spacing
- Strong 2px borders via `border-foreground/80` for section dividers and cards
- Generous padding (p-6 to p-8 typical)
- Clear visual hierarchy through spacing

### Interactive Elements
- Buttons: Solid backgrounds with bold text, clear hover states
- Links: Underlines, not color-only differentiation
- Hover states: Background fills or color shifts, no subtle opacity changes

### Component Patterns
- **Cards**: 2px `border-foreground/80` border, cream background, bold title
- **Sections**: Often alternate between cream and dark backgrounds
- **Forms**: Simple inputs with strong borders, no rounded corners or minimal
- **Navigation**: Minimal, text-based. Active tab uses `text-primary` + `border-primary`
- **Header**: Full-width `bg-primary text-primary-foreground` bar with logo