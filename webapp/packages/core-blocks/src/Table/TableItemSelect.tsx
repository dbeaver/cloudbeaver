/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useContext, useCallback } from 'react';
import styled, { css } from 'reshadow';

import { EventContext } from '@cloudbeaver/core-events';
import { useStyles } from '@cloudbeaver/core-theming';

import { Checkbox } from '../FormControls/Checkboxes/Checkbox';
import { EventTableItemSelectionFlag } from './EventTableItemSelectionFlag';
import { TableContext } from './TableContext';
import { TableItemContext } from './TableItemContext';

interface Props {
  checked?: boolean;
  disabled?: boolean;
  tooltip?: string;
  className?: string;
}

const checkboxStyles = css`
  Checkbox {
    margin-left: -10px;
    margin-right: -10px;
  }
`;

export const TableItemSelect = observer<Props>(function TableItemSelect({ checked, disabled, tooltip, className }) {
  const tableContext = useContext(TableContext);
  const context = useContext(TableItemContext);
  const styles = useStyles();
  const handleClick = useCallback((event: React.MouseEvent<HTMLInputElement, MouseEvent>) => {
    if (!context) {
      return;
    }
    const state = !context.isSelected();
    EventContext.set(event, EventTableItemSelectionFlag, state);

    tableContext?.setItemSelect(context.item, state);
  }, [tableContext, context]);

  if (!context) {
    return null;
  }

  return styled(styles, checkboxStyles)(
    <Checkbox
      className={className}
      title={tooltip}
      disabled={context.selectDisabled || disabled}
      checked={checked || context.isSelected()}
      onClick={handleClick}
    />
  );
});
