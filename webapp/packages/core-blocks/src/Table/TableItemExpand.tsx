/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useContext, useCallback } from 'react';
import styled, { use } from 'reshadow';

import { EventContext } from '@cloudbeaver/core-events';
import { useTranslate } from '@cloudbeaver/core-localization';

import { Icon } from '../Icon';
import { BASE_TABLE_STYLES } from './BASE_TABLE_STYLES';
import { EventTableItemExpandFlag } from './EventTableItemExpandFlag';
import { EventTableItemSelectionFlag } from './EventTableItemSelectionFlag';
import { TableContext } from './TableContext';
import { TableItemContext } from './TableItemContext';

interface Props {
  onExpand?: (item: any, state: boolean) => void;
  className?: string;
  disabled?: boolean;
}

export const TableItemExpand = observer<Props>(function TableItemExpand({
  onExpand,
  className,
  disabled,
}) {
  const translate = useTranslate();
  const tableContext = useContext(TableContext);
  const context = useContext(TableItemContext);
  if (!context) {
    throw new Error('TableContext must be provided');
  }
  const handleClick = useCallback((event: React.MouseEvent<HTMLInputElement>) => {
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
  }, [tableContext, context, onExpand, disabled]);

  return styled(BASE_TABLE_STYLES)(
    <table-item-expand-box className={className} title={translate('ui_expand')} onClick={handleClick}>
      <Icon name="angle" viewBox="0 0 15 8" {...use({ expanded: context.isExpanded() })} />
    </table-item-expand-box>
  );
});
