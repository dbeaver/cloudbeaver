/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import { useContext, useCallback } from 'react';
import styled, { css } from 'reshadow';

import { useStyles } from '@cloudbeaver/core-theming';

import { Checkbox } from '../FormControls/Checkboxes/Checkbox';
import { TableContext } from './TableContext';
import { TableItemContext } from './TableItemContext';

interface Props {
  checked?: boolean;
  disabled?: boolean;
  className?: string;
}

const checkboxStyles = css`
  Checkbox {
    margin-left: -10px;
    margin-right: -10px;
  }
`;

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

  return styled(styles, checkboxStyles)(
    <Checkbox
      className={className}
      disabled={context.selectDisabled || disabled}
      checked={checked || context.isSelected()}
      onClick={handleClick}
    />
  );
});
