# Asset Guidelines

## Placeholder Location

Placeholder visual assets live in:

```text
public/placeholders/
```

They are lightweight, editable SVG files intended to support early layouts
without locking the product into a final visual style.

Reference them from the application with public paths such as:

```text
/placeholders/focus-room-banner.svg
```

## Replacing Placeholders

- Preserve the existing filename when a replacement serves the same purpose.
- Keep the current `viewBox` where practical to avoid unexpected layout changes.
- Preserve useful `<title>` and `<desc>` accessibility text.
- Remove the placeholder only after every reference has moved to a replacement.
- Review replacements in light and dark contexts before merging.
- Do not add external image URLs or runtime asset dependencies.

The placeholder SVGs use `--ccad-*` CSS variables with fallback colors. These
variables may be revised or removed when the final visual system is established.

## Naming Conventions

- Use lowercase kebab-case filenames: `focus-room-banner.svg`.
- Name assets by purpose, not visual appearance: prefer `studio-desk.svg` over
  `brown-desk.svg`.
- Add a meaningful suffix for variants: `william-avatar-away.svg`.
- Keep temporary or exploratory assets out of `public/placeholders/`.
- Place final assets in a purpose-specific public folder when the asset system
  is established.

## SVG Versus PNG

Use SVG for:

- Icons, simple illustrations, diagrams, charts, and pixel-aligned placeholders
- Assets that need easy color, shape, or size revision
- Graphics that should remain sharp at multiple display sizes

Use PNG for:

- Final raster artwork, detailed pixel art, textures, or images with complex
  shading
- Assets where exact pixel rendering matters more than editability
- Images that cannot be represented efficiently as SVG

Do not convert a simple editable SVG into PNG without a clear rendering or
performance reason. Optimize either format before shipping and keep source
artwork available for future revision.
