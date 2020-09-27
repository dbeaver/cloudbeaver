/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import { useContext, useCallback } from 'react';
import styled from 'reshadow';

import { useStyles } from '@cloudbeaver/core-theming';

import { TableContext } from './TableContext';
import { TableItemContext } from './TableItemContext';

type Props = {
  checked?: boolean;
  disabled?: boolean;
  className?: string;
}

export const TableItemSelect = observer(function TableItemSelect({ checked, disabled, className }: Props) {
  const tableContext = useContext(TableContext);
  const context = useContext(TableItemContext);
  const styles = useStyles();
  const handleClick = useCallback((event: React.MouseEvent<HTMLInputElement, MouseEvent>) => {
    if (!context) {
      return;
    }
    event.stopPropagation();
    tableContext?.setItemSelect(context.item, !context.isSelected());
  }, [tableContext, context]);

  if (!context) {
    return null;
  }

  return styled(styles)(
    <input type='checkbox' checked={checked || context.isSelected()} onClick={handleClick} className={className} disabled={context.selectDisabled || disabled}/>
  );
});
