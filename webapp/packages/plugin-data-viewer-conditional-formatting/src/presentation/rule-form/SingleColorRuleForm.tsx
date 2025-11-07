/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Button, Group, GroupItem, GroupTitle, Select, useTranslate } from '@cloudbeaver/core-blocks';
import { observer } from 'mobx-react-lite';
import { DEFAULT_FORMAT_RULES } from '../../formatting/DEFAULT_FORMAT_RULES.js';
import type { IFormatRuleState } from '../../formatting/IFormatRuleState.js';
import { RenderParameter } from './RenderParameter.js';
import type { IColumnInfo } from '../../formatting/IColumnInfo.js';
import { FormattingStyle } from './FormattingStyle.js';

interface Props {
  columns: IColumnInfo[];
  state: IFormatRuleState;
  onDelete?: () => void;
}

export const SingleColorRuleForm = observer<Props>(function SingleColorRuleForm({ columns, state, onDelete }) {
  const t = useTranslate();

  const rule = DEFAULT_FORMAT_RULES.find(r => r.id === state.ruleId);

  return (
    <Group gap overflow>
      <GroupTitle>{t('plugin_data_viewer_conditional_formatting_format_rules')}</GroupTitle>
      {columns && (
        <GroupItem>
          <Select items={columns} name="column" state={state} keySelector={item => item.key} valueSelector={item => t(item.name)} zeroBasis small>
            {t('plugin_data_viewer_conditional_formatting_column')}
          </Select>
        </GroupItem>
      )}
      <Select
        name="ruleId"
        state={state}
        items={DEFAULT_FORMAT_RULES}
        keySelector={item => item.id}
        valueSelector={item => t(item.name)}
        placeholder={t('plugin_data_viewer_conditional_formatting_select_rule')}
        small
      >
        {t('plugin_data_viewer_conditional_formatting_format_cells_if')}
      </Select>
      {Object.values(rule?.parameters ?? {}).map(param => (
        <RenderParameter key={param.key} parameter={param} state={state.parameters} />
      ))}

      <FormattingStyle rule={rule!} state={state} />

      {onDelete && (
        <GroupItem>
          <Button icon="delete" iconPlacement="start" type="button" variant="secondary" onClick={onDelete}>
            {t('ui_delete')}
          </Button>
        </GroupItem>
      )}
    </Group>
  );
});
