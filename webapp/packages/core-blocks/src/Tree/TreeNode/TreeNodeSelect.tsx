/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useContext } from 'react';

import { EventContext } from '@cloudbeaver/core-events';

import { Checkbox } from '../../FormControls/Checkboxes/Checkbox.js';
import { Loader } from '../../Loader/Loader.js';
import { s } from '../../s.js';
import { useS } from '../../useS.js';
import { EventTreeNodeSelectFlag } from './EventTreeNodeSelectFlag.js';
import { TreeNodeContext } from './TreeNodeContext.js';
import style from './TreeNodeSelect.module.css';

interface Props {
  group?: boolean;
  onSelect?: () => Promise<boolean | void> | boolean | void;
  selected?: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  loadIndicator?: boolean;
  className?: string;
}

export const TreeNodeSelect = observer<Props>(function TreeNodeSelect({
  onSelect,
  group,
  selected,
  indeterminate,
  disabled,
  loadIndicator,
  className,
}) {
  const styles = useS(style);
  const context = useContext(TreeNodeContext);

  if (!context) {
    throw new Error('Context not provided');
  }

  disabled = disabled || context.disabled;
  group = group ?? context.group;
  const loading = loadIndicator && context.loading;
  selected = selected ?? context.selected;
  indeterminate = indeterminate ?? context.indeterminateSelected;

  async function handleSelect() {
    await onSelect?.();
    await context!.select(true, group);
  }

  function handleClick(event: React.MouseEvent<HTMLInputElement>) {
    EventContext.set(event, EventTreeNodeSelectFlag);
  }

  function handleDbClick(event: React.MouseEvent<HTMLDivElement>) {
    EventContext.set(event, EventTreeNodeSelectFlag);
  }

  return (
    <div className={className} onClick={handleClick} onDoubleClick={handleDbClick}>
      {loading ? (
        <Loader className={s(styles, { loader: true })} small />
      ) : (
        <Checkbox checked={selected} indeterminate={indeterminate} disabled={disabled} onChange={handleSelect} />
      )}
    </div>
  );
});
