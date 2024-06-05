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

import { Checkbox } from '../FormControls/Checkboxes/Checkbox';
import { s } from '../s';
import { useS } from '../useS';
import { EventTableItemSelectionFlag } from './EventTableItemSelectionFlag';
import { TableContext } from './TableContext';
import { TableItemContext } from './TableItemContext';
import styles from './TableItemSelect.module.css';

interface Props {
  checked?: boolean;
  disabled?: boolean;
  tooltip?: string;
  className?: string;
}

export const TableItemSelect = observer<Props>(function TableItemSelect({ checked, disabled, tooltip, className }) {
  const tableContext = useContext(TableContext);
  const context = useContext(TableItemContext);
  const selected = checked ?? context?.isSelected();
  const style = useS(styles);

  function handleClick(event: React.MouseEvent<HTMLInputElement>) {
    if (!context) {
      return;
    }
    EventContext.set(event, EventTableItemSelectionFlag, !selected);

    tableContext?.setItemSelect(context.item, !selected);
  }

  if (!context) {
    return null;
  }

  return (
    <Checkbox
      className={s(style, { checkbox: true }, className)}
      title={tooltip}
      disabled={context.selectDisabled || disabled}
      checked={selected}
      onClick={handleClick}
    />
  );
});
