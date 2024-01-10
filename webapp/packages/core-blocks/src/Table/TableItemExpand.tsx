/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useCallback, useContext } from 'react';

import { EventContext } from '@cloudbeaver/core-events';

import { Icon } from '../Icon';
import { useTranslate } from '../localization/useTranslate';
import { s } from '../s';
import { useS } from '../useS';
import { EventTableItemExpandFlag } from './EventTableItemExpandFlag';
import { EventTableItemSelectionFlag } from './EventTableItemSelectionFlag';
import { TableContext } from './TableContext';
import { TableItemContext } from './TableItemContext';
import style from './TableItemExpand.m.css';

interface Props {
  onExpand?: (item: any, state: boolean) => void;
  className?: string;
  disabled?: boolean;
}

export const TableItemExpand = observer<Props>(function TableItemExpand({ onExpand, className, disabled }) {
  const translate = useTranslate();
  const tableContext = useContext(TableContext);
  const context = useContext(TableItemContext);
  const styles = useS(style);

  if (!context) {
    throw new Error('TableContext must be provided');
  }
  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLInputElement>) => {
      if (disabled) {
        return;
      }

      const state = !context.isExpanded();

      EventContext.set(event, EventTableItemExpandFlag, state);
      EventContext.set(event, EventTableItemSelectionFlag);
      tableContext?.setItemExpand(context.item, state);

      if (onExpand) {
        onExpand(context.item, state);
      }
    },
    [tableContext, context, onExpand, disabled],
  );

  return (
    <div className={s(styles, { tableItemExpandBox: true }, className)} title={translate('ui_expand')} onClick={handleClick}>
      <Icon name="angle" viewBox="0 0 15 8" className={s(styles, { tableItemExpandBoxIcon: true, expanded: context.isExpanded() })} />
    </div>
  );
});
