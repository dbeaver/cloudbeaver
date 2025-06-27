/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useCallback, useContext } from 'react';

import { EventContext } from '@cloudbeaver/core-events';

import { Icon } from '../Icon.js';
import { useTranslate } from '../localization/useTranslate.js';
import { s } from '../s.js';
import { useS } from '../useS.js';
import { EventTableItemExpandFlag } from './EventTableItemExpandFlag.js';
import { EventTableItemSelectionFlag } from './EventTableItemSelectionFlag.js';
import { TableContext } from './TableContext.js';
import { TableItemContext } from './TableItemContext.js';
import style from './TableItemExpand.module.css';
import { IconButton } from '@dbeaver/ui-kit';

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
    (event: React.MouseEvent<HTMLButtonElement>) => {
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
    <IconButton size="small" aria-label={translate('ui_expand')} className={className} title={translate('ui_expand')} onClick={handleClick}>
      <Icon name="angle" viewBox="0 0 15 8" className={s(styles, { tableItemExpandBoxIcon: true, expanded: context.isExpanded() })} />
    </IconButton>
  );
});
