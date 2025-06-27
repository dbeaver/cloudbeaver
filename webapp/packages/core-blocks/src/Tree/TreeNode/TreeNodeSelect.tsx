/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useContext } from 'react';

import { Checkbox } from '../../FormControls/Checkboxes/Checkbox.js';
import { Loader } from '../../Loader/Loader.js';
import { s } from '../../s.js';
import { useS } from '../../useS.js';
import { TreeNodeContext } from './TreeNodeContext.js';
import style from './TreeNodeSelect.module.css';

interface Props {
  onSelect?: () => Promise<unknown> | undefined;
  selected?: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  loadIndicator?: boolean;
  className?: string;
}

export const TreeNodeSelect = observer<Props>(function TreeNodeSelect({ onSelect, selected, indeterminate, disabled, loadIndicator, className }) {
  const styles = useS(style);
  const context = useContext(TreeNodeContext);

  if (!context) {
    throw new Error('Context not provided');
  }

  disabled = disabled || context.disabled || context.processing || context.loading;
  const loading = loadIndicator && context.loading;
  selected = selected ?? context.selected;
  indeterminate = indeterminate ?? context.indeterminateSelected;

  async function handleSelect() {
    await onSelect?.();
  }

  return (
    <div className={className}>
      {loading ? (
        <Loader className={s(styles, { loader: true })} small />
      ) : (
        <Checkbox checked={selected} indeterminate={indeterminate} disabled={disabled} onChange={handleSelect} />
      )}
    </div>
  );
});
