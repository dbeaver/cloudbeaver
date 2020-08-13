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
  disabled?: boolean;
  className?: string;
}

export const TableItemSelect = observer(function TableItemSelect({ disabled, className }: Props) {
  const tableContext = useContext(TableContext);
  const context = useContext(TableItemContext);
  if (!context) {
    return null;
  }
  const handleClick = useCallback((event: React.MouseEvent<HTMLInputElement, MouseEvent>) => {
    event.stopPropagation();
    tableContext?.setItemSelect(context.item, !context.isSelected());
  }, [tableContext, context]);

  return styled(useStyles())(
    <input type='checkbox' checked={context.isSelected()} onClick={handleClick} className={className} disabled={context.selectDisabled || disabled}/>
  );
});
