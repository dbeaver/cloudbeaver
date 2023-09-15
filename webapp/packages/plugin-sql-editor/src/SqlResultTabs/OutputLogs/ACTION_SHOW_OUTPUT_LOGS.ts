import { createAction } from '@cloudbeaver/core-view';

export const ACTION_SHOW_OUTPUT_LOGS = createAction('action-show_output_logs', {
  label: 'sql_editor_output_logs_button_tooltip',
  icon: '/icons/sql_output_logs.svg',
  tooltip: 'sql_editor_output_logs_button_tooltip',
});
