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

import type { IDatabaseDataModel } from '../../DatabaseDataModel/IDatabaseDataModel';
import classes from './TableHeader.m.css';
import { TableHeaderService } from './TableHeaderService';

interface Props {
  model: IDatabaseDataModel<any, any>;
  resultIndex: number;
  simple: boolean;
  className?: string;
}

export const TableHeader = observer<Props>(function TableHeader({ model, resultIndex, simple, className }) {
  const styles = useS(classes);
  const service = useService(TableHeaderService);

  return (
    <div className={s(styles, { tableHeader: true }, className)}>
      <Placeholder container={service.tableHeaderPlaceholder} model={model} resultIndex={resultIndex} simple={simple} />
    </div>
  );
});
