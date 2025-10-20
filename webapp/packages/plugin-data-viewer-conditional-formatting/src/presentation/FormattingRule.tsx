/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Cell, ActionIconButton, useTranslate } from '@cloudbeaver/core-blocks';
import { GridDataKeysUtils } from '@cloudbeaver/plugin-data-viewer';
import { COLOR_SCALE_RULE, DEFAULT_FORMAT_RULES } from '../formatting/DEFAULT_FORMAT_RULES.js';
import type { IFormatRuleState } from '../formatting/IFormatRuleState.js';
import { FormattingPreview } from './FormattingPreview.js';
import { ALL_COLUMNS } from '../formatting/ALL_COLUMNS.js';
import type { IColumnInfo } from '../formatting/IColumnInfo.js';
import { observer } from 'mobx-react-lite';
import { clsx } from '@dbeaver/ui-kit';
import { useLayoutEffect, useRef } from 'react';

interface Props {
  columns: IColumnInfo[];
  state: IFormatRuleState;
  preview?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  onDelete?: () => void;
}

export const FormattingRule = observer<Props>(function FormattingRule({ columns, state, preview, selected, onSelect, onDelete }) {
  const ref = useRef<HTMLDivElement>(null);
  const t = useTranslate();
  const rule = state.type === 'scale' ? COLOR_SCALE_RULE : DEFAULT_FORMAT_RULES.find(r => r.id === state.ruleId);

  useLayoutEffect(() => {
    if (selected) {
      requestAnimationFrame(() => {
        ref.current?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
      });
    }
  }, [selected]);

  if (!rule) {
    return null;
  }

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    e.preventDefault();
    onDelete?.();
  }

  const name = rule.getName?.(t, state.parameters) || t(rule.name);
  const description =
    state.column && !GridDataKeysUtils.isEqual(state.column, ALL_COLUMNS.key)
      ? columns.find(col => state.column && GridDataKeysUtils.isEqual(col.key, state.column))?.name
      : undefined;

  const title = `${name}${description ? ` - ${description}` : ''}`;

  if (preview) {
    return (
      <Cell
        ref={ref}
        before={<FormattingPreview state={state} rule={rule} text="A" />}
        className={clsx('tw:rounded-(--theme-group-element-radius) tw:overflow-hidden tw:cursor-pointer theme-ripple-selectable tw:shrink-0', {
          'tw:before:bg-(--theme-primary)!': selected,
        })}
        title={title}
        aria-selected={selected}
        big
        onClick={onSelect}
      />
    );
  }

  return (
    <Cell
      ref={ref}
      before={<FormattingPreview state={state} rule={rule} text="A" />}
      description={description}
      after={<ActionIconButton name="delete" title={t('ui_delete')} onClick={handleClick} />}
      className="tw:rounded-(--theme-group-element-radius) tw:overflow-hidden tw:cursor-pointer"
      title={title}
      big
      onClick={onSelect}
    >
      {name}
    </Cell>
  );
});
