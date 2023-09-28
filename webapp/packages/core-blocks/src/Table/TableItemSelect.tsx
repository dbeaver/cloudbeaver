/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useContext } from 'react';
import styled, { css } from 'reshadow';

import { EventContext } from '@cloudbeaver/core-events';

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

const styles = css`
  Checkbox {
    margin-left: -10px;
    margin-right: -10px;
  }
`;

export const TableItemSelect = observer<Props>(function TableItemSelect({ checked, disabled, tooltip, className }) {
  const tableContext = useContext(TableContext);
  const context = useContext(TableItemContext);
  const selected = checked ?? context?.isSelected();

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

  return styled(styles)(
    <Checkbox className={className} title={tooltip} disabled={context.selectDisabled || disabled} checked={selected} onClick={handleClick} />,
  );
});
