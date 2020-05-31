/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import { useContext } from 'react';
import styled from 'reshadow';

import { useStyles } from '@dbeaver/core/theming';

import { TableItemContext } from './TableItemContext';

type Props = {
  className?: string;
}

export const TableItemSelect = observer(function TableItemSelect({ className }: Props) {
  const context = useContext(TableItemContext);
  if (!context) {
    return null;
  }

  return styled(useStyles())(
    <input type='checkbox' checked={context.isSelected()} className={className}/>
  );
});
