import { createDataContext } from '@cloudbeaver/core-view';

import type { SqlOutputLogsPanelState } from './useOutputLogsPanelState';

export const OUTPUT_LOGS_PANEL_STATE = createDataContext<SqlOutputLogsPanelState>('output-logs-panel-state');
