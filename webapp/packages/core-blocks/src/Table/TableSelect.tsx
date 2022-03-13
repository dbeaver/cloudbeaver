/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useContext } from 'react';
import styled, { css } from 'reshadow';

import { useTranslate } from '@cloudbeaver/core-localization';

import { Checkbox } from '../FormControls/Checkboxes/Checkbox';
import { BASE_TABLE_STYLES } from './BASE_TABLE_STYLES';
import { TableContext } from './TableContext';

interface Props {
  id?: string;
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

export const TableSelect = observer<Props>(function TableSelect({ id, disabled, tooltip, className }) {
  const tableContext = useContext(TableContext);
  const translate = useTranslate();

  if (!tableContext) {
    throw new Error('Context must be provided');
  }

  return styled(BASE_TABLE_STYLES, styles)(
    <Checkbox
      id={id}
      className={className}
      title={tooltip || translate('ui_select_all')}
      disabled={disabled || !tableContext.state.selectableItems.length}
      checked={tableContext.state.tableSelected}
      onClick={tableContext.state.selectTable}
    />
  );
});
