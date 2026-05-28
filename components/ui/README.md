# UI primitives

Canonical, typed building blocks for PerformLabs. They wrap the design-token
classes defined in `app/globals.css`, so they stay visually consistent with the
existing surfaces while giving new code a single, well-typed API.

> **Rule of thumb:** new UI should import from `@/components/ui` instead of
> hand-writing `className="btn primary"`, `className="card span6"`, etc.
> Existing markup keeps working through the raw classes and can be migrated
> surface by surface.

## Components

| Primitive | Replaces | Notes |
| --- | --- | --- |
| `Button` | `<Link className="btn …">`, `<button className="btn …">` | Renders a Next `Link` when `href` is set, else a native `button`. Props: `variant` (`primary` \| `secondary` \| `ghost` \| `danger`), `size` (`sm` \| `md` \| `lg`), `loading`. |
| `Card` | `<article className="card span6 …">` | `span` (3–12) and `interactive` props. |
| `Badge` | `<span className="tag …">` | `tone` (`accent` \| `success` \| `danger` \| `info` \| `warning` \| `neutral`). |
| `Stat` | `.metric` blocks | Numeric `value` animates with `AnimatedNumber`. |
| `Table` | `<table className="table">` | Column-config driven. |
| `InputField` / `TextareaField` | label + input + error | Wires `aria-invalid` and `aria-describedby`. |
| `AnimatedNumber` | hard-coded figures | Count-up on scroll; respects reduced-motion. |
| `Reveal` | — | Scroll-triggered entrance (framer-motion); respects reduced-motion. |
| `SceneOrbit` | `BrandOrbit` internals | Themeable react-three-fiber mark; reads the live `--accent` token. |

## Theming

Everything resolves through the `--accent` token. The white-label brand color is
injected as `--accent` on the shell (`components/page-shell.tsx`), so primitives
— including the 3D `SceneOrbit` — tint automatically.

## Example

```tsx
import { Button, Card, Badge, Stat } from "@/components/ui";

<Card span={6} interactive>
  <Badge tone="success">Activo</Badge>
  <Stat label="Adherencia" value={86} suffix="%" />
  <Button variant="primary" href="/app/workouts">Empezar</Button>
</Card>;
```
