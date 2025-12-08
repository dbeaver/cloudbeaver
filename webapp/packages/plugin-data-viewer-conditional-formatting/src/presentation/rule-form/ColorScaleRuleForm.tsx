/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Button, Group, GroupItem, GroupTitle, Select, useTranslate } from '@cloudbeaver/core-blocks';
import { observer } from 'mobx-react-lite';
import { useDeferredValue, useMemo } from 'react';
import { COLOR_SCALE_RULE } from '../../formatting/DEFAULT_FORMAT_RULES.js';
import type { IFormatRuleState } from '../../formatting/IFormatRuleState.js';
import type { IColumnInfo } from '../../formatting/IColumnInfo.js';
import { getMiddleColor } from '../../getMiddleColor.js';
import { ColorScalePreview } from '../ColorScalePreview.js';
import { useColorScaleParameters } from './useColorScaleParameters.js';
import { ColorScalePointFields } from './ColorScalePointFields.js';

interface Props {
  columns: IColumnInfo[];
  state: IFormatRuleState;
  onDelete?: () => void;
}

export const ColorScaleRuleForm = observer<Props>(function ColorScaleRuleForm({ columns, state, onDelete }) {
  const t = useTranslate();
  const { min, mid, max } = useColorScaleParameters(COLOR_SCALE_RULE, state);

  const minColorDeferred = useDeferredValue(min.colorValue);
  const maxColorDeferred = useDeferredValue(max.colorValue);

  const isNoneMid = mid.valueDisabled;
  const effectiveMidColor = useMemo(
    () => (isNoneMid ? getMiddleColor(minColorDeferred, maxColorDeferred) : mid.colorValue),
    [isNoneMid, minColorDeferred, maxColorDeferred, mid.colorValue],
  );

  return (
    <Group gap overflow>
      <GroupTitle>{t('plugin_data_viewer_conditional_formatting_format_rules')}</GroupTitle>

      <ColorScalePreview leftColor={minColorDeferred} midColor={isNoneMid ? undefined : mid.colorValue} rightColor={maxColorDeferred} />

      {columns && (
        <Select items={columns} name="column" state={state} keySelector={item => item.key} valueSelector={item => t(item.name)} zeroBasis tiny>
          {t('plugin_data_viewer_conditional_formatting_column')}
        </Select>
      )}

      <ColorScalePointFields
        typeParam={min.typeParam}
        valueParam={min.valueParam}
        colorParam={min.colorParam}
        defaultColorValue={min.colorValue}
        state={state.parameters}
        valueDisabled={min.valueDisabled}
      />

      <ColorScalePointFields
        typeParam={mid.typeParam}
        valueParam={mid.valueParam}
        colorParam={mid.colorParam}
        state={state.parameters}
        valueDisabled={mid.valueDisabled}
        colorMapState={() => effectiveMidColor}
        colorDisabled={isNoneMid}
      />

      <ColorScalePointFields
        typeParam={max.typeParam}
        valueParam={max.valueParam}
        colorParam={max.colorParam}
        state={state.parameters}
        valueDisabled={max.valueDisabled}
      />

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
