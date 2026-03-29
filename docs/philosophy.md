# Philosophy

## Design Language

### Philosophy

Warm, calm, and reassuring. The design should feel like a trusted care tool, not medical software. Prioritize clarity, emotional ease, and speed of use. Use softness, spacing, and gentle emphasis to make medication logging feel simple and dependable.

### Colors

- **Background**: `#faf5ee` (warm parchment)
- **Text**: `#2d2418` (soft espresso)
- **Muted text**: `#8a7e6d`
- **Primary accent**: `#7d9b76` (sage)
- **Accent hover**: `#6d8b66`
- **Highlight**: `#d4764e` (terra cotta for warmth and emphasis)
- **Borders**: `rgba(45, 36, 24, 0.1)` or `rgba(45, 36, 24, 0.12)`
- **Inverted sections**: `#1a1612` background with `#e8e0d4` text

### Typography

- **Headings**: DM Sans Variable, black weights, tight tracking
- **Body**: DM Sans Variable, clean and highly readable
- **Monospace**: For timestamps, metadata, labels, and numeric stats
- Use strong size contrast, but keep the overall feel soft and approachable

### Borders & Spacing

- Soft 1px borders with low-contrast warm neutrals
- Medium to large radii (`rounded-xl` to `rounded-2xl`) across cards, forms, and navigation
- Generous padding (`p-4` to `p-6` typical)
- Use spacing and grouping to reduce cognitive load

### Interactive Elements

- Buttons: Rounded, solid, and easy to scan; primary actions should feel supportive, not loud
- Links: Clear and direct, with color and subtle emphasis
- Hover states: Gentle lifts, fills, or tone shifts; avoid harsh flashes
- Status states: Use distinct semantic colors for taken, late, missed, and pending

### Component Patterns

- **Cards**: Rounded surfaces, warm backgrounds, light borders, subtle depth
- **Sections**: Small labeled intros, strong headings, generous breathing room
- **Forms**: Simple inputs with soft borders and rounded corners; should feel approachable and fast
- **Navigation**: Compact, sticky when useful, and built around rounded pills and clear hierarchy
