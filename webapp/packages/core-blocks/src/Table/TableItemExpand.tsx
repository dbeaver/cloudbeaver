/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import { useContext, useCallback } from 'react';
import styled, { use } from 'reshadow';

import { useStyles } from '@cloudbeaver/core-theming';

import { Icon } from '../Icons/Icon';
import { TableContext } from './TableContext';
import { TableItemContext } from './TableItemContext';

type Props = {
  onExpand?: (item: any, state: boolean) => void;
  className?: string;
  disabled?: boolean;
}

export const TableItemExpand = observer(function TableItemExpand({
  onExpand,
  className,
  disabled,
}: Props) {
  const tableContext = useContext(TableContext);
  const context = useContext(TableItemContext);
  const styles = useStyles();
  if (!context) {
    return null;
  }
  const handleClick = useCallback((event: React.MouseEvent<HTMLInputElement, MouseEvent>) => {
    event.stopPropagation();

    if (disabled) {
      return;
    }

    const state = !context.isExpanded();

    tableContext?.setItemExpand(context.item, state);

    if (onExpand) {
      onExpand(context.item, state);
    }
  }, [tableContext, context, onExpand, disabled]);

  return styled(styles)(
    <table-item-expand-box as='div' className={className} onClick={handleClick}>
      <Icon name="angle" viewBox="0 0 15 8" {...use({ expanded: context.isExpanded() })}/>
    </table-item-expand-box>
  );
});
