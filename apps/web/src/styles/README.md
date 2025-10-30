# Styles Architecture

Feature-based organization for scalable styling system.

## Directory Structure

```
styles/
├── core/
│   └── vars.scss              # Design tokens & CSS custom properties
├── controls/
│   ├── buttons.scss           # Button mixins
│   ├── forms.scss             # Input, checkbox, slider mixins
│   ├── labels.scss            # Label mixins
│   └── utilities.scss         # Control utilities (sections, groups, etc.)
└── layout/
    └── overlays.scss          # Overlay positioning & styling
```

## Core

### `core/vars.scss`
**Design tokens and CSS custom properties**

Contains:
- Color palette (primary, secondary, background, text)
- Spacing scale (xs, sm, md, lg, xl)
- Typography (font sizes, weights)
- Border radius values
- Transition durations
- Z-index layers
- Overlay styling variables

Usage:
```scss
// CSS custom properties are globally available
.my-component {
  color: var(--color-primary);
  padding: var(--spacing-md);
}
```

## Controls

### `controls/buttons.scss`
**Button component mixins**

Mixins:
- `btn-base` - Base button styling with glass effect
- `btn-preset` - Standard button with preset sizing
- `btn-icon` - Icon-only button (square aspect ratio)

Usage:
```scss
@use "@/styles/controls/buttons" as *;

button {
  @include btn-preset;
}
```

### `controls/forms.scss`
**Form control mixins (inputs, checkboxes, sliders)**

Mixins:
- `input-base` - Base input styling
- `input-number` - Number input (hides spinners)
- `checkbox-base` - Checkbox styling
- `slider-input` - Complete range slider styling
- `slider-track` - Slider track only
- `slider-thumb` - Slider thumb only

Usage:
```scss
@use "@/styles/controls/forms" as *;

input[type="number"] {
  @include input-number;
}

input[type="range"] {
  @include slider-input;
}
```

### `controls/labels.scss`
**Label mixins**

Mixins:
- `label-base` - Block label (above input)
- `label-inline` - Inline label (next to checkbox/radio)

Usage:
```scss
@use "@/styles/controls/labels" as *;

label {
  @include label-base;
}
```

### `controls/utilities.scss`
**Control utility mixins**

Mixins:
- `control-group` - Vertical group of controls with consistent spacing
- `section` - Grid section wrapper with background
- `value-display` - Display value styling (for sliders, etc.)
- `hint-text` - Small hint/help text styling
- `toggle-button` - Collapsible section toggle button
- `toggle-icon` - Animated icon for collapsible sections

Usage:
```scss
@use "@/styles/controls/utilities" as *;

.control-container {
  @include control-group;
}

.section-header button {
  @include toggle-button;
}
```

## Layout

### `layout/overlays.scss`
**Overlay positioning and styling**

Mixins:
- `overlay-base` - Base overlay properties
- `overlay-top-left`, `overlay-top-right` - Corner positioning
- `overlay-bottom-left`, `overlay-bottom-right` - Bottom corners
- `overlay-light` - Light theme overlay
- `overlay-dark` - Dark theme overlay

Usage:
```scss
@use "@/styles/layout/overlays" as overlays;

.my-overlay {
  @include overlays.overlay-top-right;
  @include overlays.overlay-dark;
}
```

## Design Principles

1. **Feature-Based Organization:** Files grouped by feature area (controls, layout, etc.)
2. **Explicit Imports:** Components import only what they need
3. **Modern Sass:** Uses `@use` instead of deprecated `@import`
4. **CSS Custom Properties:** Design tokens use CSS variables for runtime flexibility
5. **Composable Mixins:** Small, focused mixins that can be combined
6. **Consistent Naming:** kebab-case for files, mixins, and variables

## Import Patterns

```scss
// Import multiple control mixins
@use "@/styles/controls/buttons" as *;
@use "@/styles/controls/forms" as *;

// Import with namespace (overlays)
@use "@/styles/layout/overlays" as overlays;
@include overlays.overlay-dark;

// Import relative path
@use "../../styles/controls/labels" as *;
```
