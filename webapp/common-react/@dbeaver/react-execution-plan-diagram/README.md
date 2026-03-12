# @dbeaver/react-execution-plan-diagram

Interactive execution plan diagram component. Renders a tree of plan nodes with
cost bars, heavy-route highlighting, pan/zoom, collapse, and keyboard navigation.

## Two usage modes

| Mode           | Entry point                                     | Consumer                                          |
| -------------- | ----------------------------------------------- | ------------------------------------------------- |
| **React**      | `ExecutionPlanDiagram` component                | CloudBeaver webapp                                |
| **Standalone** | `createExecutionPlanDiagram()` + window globals | DBeaver desktop (SWT Browser), any non-React host |

## Build

```bash
# React library (TypeScript → lib/)
yarn build

# Standalone bundle (Vite → dist/)
yarn build:standalone
```

Standalone output (`dist/`):

- `execution-plan-diagram.js` — self-contained bundle with React included
- `execution-plan-diagram.css` — component styles with CSS custom properties

## React usage

```tsx
import { ExecutionPlanDiagram, useDiagramActions } from '@dbeaver/react-execution-plan-diagram';

function MyToolbar() {
  const actions = useDiagramActions(); // available inside <ExecutionPlanDiagram>
  return <button onClick={actions.zoomIn}>+</button>;
}

<ExecutionPlanDiagram
  data={planData}
  options={{ highlightHeavyRoute: true, direction: 'LR' }}
  selectedNodeId={selectedId}
  onNodeSelect={(nodeId, node) => setSelectedId(nodeId)}
>
  <MyToolbar />
</ExecutionPlanDiagram>;
```

## Standalone usage (Java / plain HTML)

Copy `dist/execution-plan-diagram.{js,css}` into your project, then:

```html
<div id="plan-container"></div>
<script src="execution-plan-diagram.js"></script>
<script>
  window.createExecutionPlanDiagram(data, { highlightHeavyRoute: true });
</script>
```

### Window globals after `createExecutionPlanDiagram()`

| Function                            | Description                    |
| ----------------------------------- | ------------------------------ |
| `setPlanData(data)`                 | Replace plan data              |
| `setPlanOptions(options)`           | Update options (partial merge) |
| `setPlanTranslations(translations)` | Set i18n key→value map         |
| `selectPlanNode(nodeId \| null)`    | Select a node programmatically |
| `getSelectedPlanNodeId()`           | Get currently selected node ID |
| `planZoomIn()`                      | Zoom in                        |
| `planZoomOut()`                     | Zoom out                       |
| `planFitToScreen()`                 | Fit diagram to viewport        |
| `planResetView()`                   | Reset zoom/pan to default      |
| `disposePlanDiagram()`              | Unmount and clean up           |

### Java → JS callback

Define `window.onPlanNodeSelected = function(nodeId) { ... }` **before** creating
the diagram. It is called automatically whenever the user clicks a node.
In SWT Browser, register it as a `BrowserFunction`.

## Data format (`IPlanData`)

```jsonc
{
  "nodes": [
    {
      "id": "node-0", // unique identifier
      "kind": "TABLE_SCAN", // PlanNodeKind enum value
      "type": "Seq Scan", // display type from DB
      "name": "users", // optional object name
      "parentId": null, // null for root nodes
      "cost": 1234.56, // raw cost from DB
      "percent": 0.85, // fraction 0..1 (computed from cost if absent)
      "duration": 12.5, // milliseconds
      "rowCount": 1000,
      "condition": "age > 18",
      "description": "...",
      "properties": [
        // passed through for details panel
        { "id": "prop-1", "displayName": "Filter", "value": "age > 18" },
      ],
    },
    // ... more nodes (flat list with parentId references)
  ],
  "features": {
    "hasCost": true,
    "hasRows": true,
    "hasDuration": false,
    "durationMeasure": "ms", // optional unit label
  },
}
```

**Tree structure**: nodes reference parents via `parentId`. The component builds
the tree internally. Root nodes have `parentId: null` or `parentId` absent.

**`percent`**: if no node has `percent`, compute it as `cost / maxCost` before
passing data.

**`kind`**: maps to `DBCPlanNodeKind` enum — `DEFAULT`, `SELECT`, `TABLE_SCAN`,
`INDEX_SCAN`, `JOIN`, `HASH`, `UNION`, `FILTER`, `AGGREGATE`, `SORT`, `RESULT`,
`SET`, `MERGE`, `GROUP`, `MATERIALIZE`, `FUNCTION`, `MODIFY`.

## Options (`IPlanDiagramOptions`)

| Option                | Type                   | Default | Description                   |
| --------------------- | ---------------------- | ------- | ----------------------------- |
| `direction`           | `'LR' \| 'TB' \| 'RL'` | `'LR'`  | Layout direction              |
| `highlightHeavyRoute` | `boolean`              | `false` | Highlight most expensive path |
| `enableCollapse`      | `boolean`              | `true`  | Allow collapsing subtrees     |
| `className`           | `string`               | —       | Extra CSS class on viewport   |

## Theming

The component uses CSS custom properties. Override them in a parent stylesheet
to match your host theme:

```css
:root {
  --dbv-plan-viewport-bg: #fafafa;
  --dbv-plan-node-bg: #ffffff;
  --dbv-plan-node-border-color: #c0c0c0;
  --dbv-plan-node-selected-border: #2196f3;
  --dbv-plan-node-selected-glow: #2196f34d;
  --dbv-plan-node-heavy-color: #e53935;
  --dbv-plan-node-caption-bg: #f5f5f5;
  --dbv-plan-node-caption-color: #333;
  --dbv-plan-node-name-color: #1a1a1a;
  --dbv-plan-node-metric-color: #666;
  --dbv-plan-node-metric-value-color: #333;
  --dbv-plan-edge-color: #999;
  /* cost bar */
  --dbv-plan-node-cost-bar-bg: #e0e0e0;
  --dbv-plan-node-cost-bar-color: #ff9800;
}
```
