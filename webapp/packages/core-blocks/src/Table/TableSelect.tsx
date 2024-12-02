/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useContext } from 'react';

import { Checkbox } from '../FormControls/Checkboxes/Checkbox.js';
import { useTranslate } from '../localization/useTranslate.js';
import { s } from '../s.js';
import { useS } from '../useS.js';
import { TableContext } from './TableContext.js';
import style from './TableSelect.module.css';

interface Props {
  id?: string;
  disabled?: boolean;
  tooltip?: string;
  className?: string;
}

export const TableSelect = observer<Props>(function TableSelect({ id, disabled, tooltip, className }) {
  const styles = useS(style);
  const tableContext = useContext(TableContext);
  const translate = useTranslate();

  if (!tableContext) {
    throw new Error('Context must be provided');
  }

  return (
    <Checkbox
      id={id}
      className={s(styles, { tableSelect: true }, className)}
      title={tooltip || translate('ui_select_all')}
      disabled={disabled || !tableContext.state.selectableItems.length}
      checked={tableContext.state.tableSelected}
      onClick={tableContext.state.selectTable}
    />
  );
});
