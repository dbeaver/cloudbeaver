# DataDam design-token POC

The built-in light and dark themes use a snapshot of DataDam's neutral palette,
font families and radius scale. The adapter lives in
[`src/styles/shared/design-tokens.css`](src/styles/shared/design-tokens.css).

## Integration

Both theme entry points import the adapter after their original variables. It
uses the existing `.theme-light` / `.theme-dark` selectors and `base` cascade
layer, including the classes copied onto `body` for portalled menus and dialogs.
Theme IDs, saved preferences and automatic light/dark selection stay compatible.

The mapping is intentionally semantic:

| Design role                          | CloudBeaver variable / consumer                                            |
| ------------------------------------ | -------------------------------------------------------------------------- |
| Background / foreground              | `--theme-surface` / `--theme-on-surface`                                   |
| Secondary / secondary foreground     | `--theme-secondary` / `--theme-on-secondary`                               |
| Muted background                     | `--theme-background` (also used for hover fills)                           |
| Muted foreground                     | Secondary text, hints, icons and placeholders                              |
| Sidebar                              | `--theme-sub-secondary`                                                    |
| Input / border                       | Input borders / disabled and read-only borders                             |
| Card                                 | UI-kit and common dialog background                                        |
| Destructive                          | Error and negative colors                                                  |
| Geist / Inter                        | Body typography / headline typography                                      |
| Radius × 0.6 / 1.4 / 1.8 / 2.2 / 2.6 | Small actions / groups / menus and popovers / inputs and dialogs / buttons |

The primary color, its foreground, link colors and positive/status colors remain
product-owned. Focus indicators continue using the CloudBeaver primary color.
The SQL editor's monospace font is unchanged.

`--theme-design-*` contains the source values; the existing `--theme-*` and
`--dbv-kit-*` variables adapt them to current consumers. There are no global
shadcn variable names and no runtime dependency on the DataDam application.
This is a snapshot, not automatic cross-product token synchronization.

Tailwind's legacy `font-roboto` utility now resolves the active theme font using
`@theme inline`. The corresponding CSS variable is also mapped for consumers
that reference it directly. The fonts are bundled locally through Fontsource.
Input and select adapters use the theme radius instead of local `3px` values.
Buttons use sentence case and normal tracking.

UI-kit menu and dialog aliases are resolved on the theme element too. Common
dialogs no longer compose a surface-background utility that overrides the
dialog card background. Input and generic UI-kit foreground/background aliases
continue referencing the public semantic variables so product overrides of
those variables propagate to controls.

## Visual evaluation

Start the CE frontend with `yarn dev` from `webapp/packages/product-default`,
using a compatible CloudBeaver API. The existing light/dark selector applies the
POC automatically. Tune the adapter's source values or semantic mapping for the
next iteration.

Review login, connection forms, administration, portalled menus/dialogs,
navigator, SQL editor and data grid in both themes. Check long localized labels,
focus indicators, disabled/read-only fields and small inline editors. DataDam's
rounded inputs and pill buttons are a deliberately visible starting point;
compact grid editors may need a separate shape role after visual review.

Layout and density need a separate pass: current component-specific padding,
control heights, grid row sizes and fixed dialog dimensions are not governed by
one spacing token. Likewise, some borders and hover colors are derived from the
legacy background roles rather than a dedicated border/accent token. Resolve
these differences at shared component adapters as concrete visual issues appear.

## Verification of this iteration

- CE production bundle, including TypeScript compilation: passed.
- Prettier for changed files: passed.
- Source tests (`yarn test --exclude 'packages/**/lib/**'`): 9 suites, 106 tests passed.
- Chromium smoke fixture using the production CSS: light → dark → light,
  computed palette, primary color, loaded fonts, body/headline/combobox font
  families, input/select/button/menu radii, common-dialog card background,
  semantic surface/foreground overrides, button case and keyboard focus: passed.
- Full application visual review and screen-reader testing: pending a running
  CloudBeaver API; the CSS fixture does not cover application flows.
- Repository lint reports existing errors in unchanged TypeScript files; the
  unfiltered command also traverses generated bundles and runs out of memory.
- Unfiltered tests also collect stale `lib` suites; one cannot resolve
  `@cloudbeaver/tests-runner`. Dependency validation stops in its non-TTY logger
  (`process.stdout.clearLine is not a function`).

Accessibility scope: visible focus (2.4.7) was checked in the CSS fixture.
Application keyboard operation, accessible names, reading order and contrast
still need review on real screens. Media, gesture and motion-input criteria are
not applicable to this CSS-token change because it introduces none of those
interactions; session-timeout and input-reuse criteria are not applicable because
their behavior is unchanged.
