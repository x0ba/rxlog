# Dashboard Design Philosophy

## Overview

The RxLog dashboard follows a **neo-brutalist** design language — bold, typographic, and unapologetically structural. It draws inspiration from editorial poster design and developer tool interfaces, prioritizing clarity and visual impact over decoration.

## Core Principles

### 1. Typography as Architecture

The dashboard uses dramatic type scale contrast to create visual hierarchy without relying on color or decoration. The page title ("PATIENTS") is rendered at 7xl on desktop — oversized and commanding. Supporting text uses monospaced type at a small scale, creating tension between the massive headline and the functional metadata below it.

- **Headlines**: Font-black (900 weight), uppercase, tighter tracking
- **Metadata**: Monospaced, small, neutral — functional information
- **Navigation**: Monospaced breadcrumb trail with bold brand anchor

### 2. The L-Shadow Motif

Every patient card uses a distinctive **bottom-left offset shadow** in the terracotta accent color (`oklch(0.6 0.16 35)`). This asymmetric shadow:

- Creates visual depth without softness (no blur, hard edges only)
- Forms an implicit "L" shape that anchors each card to the grid
- Shifts on hover (from 5px to 7px offset) for tactile feedback
- Contrasts with the traditional bottom-right brutalist shadow used on buttons

The directional tension between card shadows (bottom-left) and button shadows (bottom-right) is intentional — it creates visual energy and prevents the layout from feeling static.

### 3. Grid Over List

Patient cards are displayed in a **responsive grid** (3 columns on desktop, 2 on tablet, 1 on mobile) rather than a vertical list. This:

- Makes better use of horizontal space
- Creates a visual "wall" of patient tiles, reinforcing the brutalist metaphor
- Allows the eye to scan non-linearly
- Gives the dashboard a product/tool feel rather than a feed

### 4. Structural Borders

Borders are first-class design elements, not afterthoughts:

- **Thick rules** (2px `border-foreground/80`) define card boundaries and section dividers
- **Dashed borders** separate metadata footers within cards and the empty state container
- **The hero rule** — a solid 0.5px line between breadcrumb and title — acts as a visual anchor point

### 5. The Initials Block

Each patient card features a prominent **square initials block** (48x48px) with a thick border and accent background. This element:

- Serves as the primary visual identifier before reading the name
- Maintains the square/brutalist geometry (no rounded corners)
- Uses the accent color to create warmth in an otherwise structural layout
- Functions as a pseudo-avatar without requiring image uploads

### 6. Counter Badge

When patients exist, a **bordered count badge** appears inline with the title. This:

- Provides at-a-glance information density
- Uses accent background + thick border for visual weight
- Is rendered in monospace for a "data readout" feel
- Only appears when there's data (no "0" badge)

### 7. Progressive Disclosure

Card content is layered from top to bottom:

1. **Identity** — Initials block (immediate visual recognition)
2. **Name** — Bold, truncated if long (primary information)
3. **Metadata** — Age, member count in mono (secondary details)
4. **Action** — "Open patient →" footer behind a dashed border (tertiary/CTA)

The dashed footer border creates a subtle "below the fold" separation, suggesting more detail awaits on click.

## Layout Structure

```
┌─────────────────────────────────────────────────┐
│  rxlog. / dashboard              [breadcrumb]   │
├─────────────────────────────────────────────────┤
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   [thick rule]  │
│                                                 │
│  PATIENTS  [3]                  [+ ADD PATIENT] │
│  Select a patient...                            │
│                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ [AB]   → │  │ [CD]   → │  │ [EF]   → │      │
│  │          │  │          │  │          │      │
│  │ Alice B. │  │ Carol D. │  │ Eve F.  │      │
│  │ 34y · 2  │  │ 67y · 1  │  │ 12y · 3 │      │
│  │┄┄┄┄┄┄┄┄┄┄│  │┄┄┄┄┄┄┄┄┄┄│  │┄┄┄┄┄┄┄┄┄┄│      │
│  │ Open   → │  │ Open   → │  │ Open  → │      │
│  └──────────┘  └──────────┘  └──────────┘      │
│   ╲ L-shadow    ╲ L-shadow    ╲ L-shadow       │
└─────────────────────────────────────────────────┘
```

## Color Usage on Dashboard

| Element           | Color Token         | Purpose                           |
| ----------------- | ------------------- | --------------------------------- |
| Initials block bg | `--accent`          | Warm, human identifier            |
| Card shadow       | `--accent` (55-75%) | L-shaped depth, hover feedback    |
| Counter badge     | `--accent` bg       | Data emphasis                     |
| Name hover        | `--primary`         | Interactive feedback (teal shift) |
| Arrow hover       | `--accent`          | Directional CTA warmth            |
| Borders           | `foreground/80`     | Structural definition             |
| Dashed borders    | `foreground/15`     | Subtle section separators         |
| Breadcrumb brand  | `foreground`        | Anchor point (bold "rxlog.")      |
| Breadcrumb path   | `muted-foreground`  | Secondary navigation context      |

## Animation

- **Cards**: Staggered `card-enter` animation (fade + slide up, 80ms delay between cards)
- **Header**: `fade-in` with slight delay for the title section
- **Hover**: Cards translate up 0.5px; shadows expand; arrows shift right
- **Optimistic**: New patients appear immediately at 70% opacity with "Saving..." pulse

## Empty State

When no patients exist, a large dashed-border container displays oversized ghost text ("NO PATIENTS YET") at very low opacity (8% foreground). This:

- Fills the visual space without creating a depressing blank page
- Uses the same typographic treatment as the title (font-black, uppercase, tight tracking)
- Provides clear direction via monospaced helper text below

## Responsive Behavior

| Breakpoint  | Grid   | Title | Card padding | Notes                         |
| ----------- | ------ | ----- | ------------ | ----------------------------- |
| Mobile      | 1 col  | 5xl   | p-4          | Full-width button below title |
| sm (640px)  | 2 cols | 7xl   | p-5          | Button moves to title row     |
| lg (1024px) | 3 cols | 7xl   | p-5          | Full grid layout              |
