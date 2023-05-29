/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { Placeholder } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';

import type { IDatabaseDataModel } from '../../DatabaseDataModel/IDatabaseDataModel';
import { TableHeaderService } from './TableHeaderService';

const styles = css`
  table-header {
    flex: 0 0 auto;
    display: flex;
    align-items: center;

    &:empty {
      display: none;
    }
  }
`;

interface Props {
  model: IDatabaseDataModel<any, any>;
  resultIndex: number;
  simple: boolean;
  className?: string;
}

export const TableHeader = observer<Props>(function TableHeader({ model, resultIndex, simple, className }) {
  const service = useService(TableHeaderService);

  return styled(styles)(
    <table-header className={className}>
      <Placeholder container={service.tableHeaderPlaceholder} model={model} resultIndex={resultIndex} simple={simple} />
    </table-header>,
  );
});
