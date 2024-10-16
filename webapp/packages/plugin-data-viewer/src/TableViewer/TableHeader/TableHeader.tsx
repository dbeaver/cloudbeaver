/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Placeholder, s, useS } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';

import type { IDatabaseDataModel } from '../../DatabaseDataModel/IDatabaseDataModel.js';
import classes from './TableHeader.module.css';
import { TableHeaderService } from './TableHeaderService.js';

interface Props {
  model: IDatabaseDataModel;
  resultIndex: number;
  simple: boolean;
  className?: string;
  tabIndex?: number;
  'data-table-header'?: boolean;
}

export const TableHeader = observer<Props>(function TableHeader({ model, resultIndex, simple, className, ...rest }) {
  const styles = useS(classes);
  const service = useService(TableHeaderService);

  return (
    <header {...rest} className={s(styles, { tableHeader: true }, className)}>
      <Placeholder container={service.tableHeaderPlaceholder} model={model} resultIndex={resultIndex} simple={simple} />
    </header>
  );
});
