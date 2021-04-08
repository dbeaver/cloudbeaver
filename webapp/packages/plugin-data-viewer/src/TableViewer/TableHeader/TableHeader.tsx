/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
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
    padding: 8px 0;
    flex: 0 0 auto;
    display: flex;
    align-items: center;
  }
`;

interface Props {
  model: IDatabaseDataModel<any, any>;
  resultIndex: number;
}

export const TableHeader = observer(function TableHeader({
  model,
  resultIndex,
}: Props) {
  const service = useService(TableHeaderService);

  return styled(styles)(
    <table-header as="div">
      <Placeholder container={service.tableHeaderPlaceholder} model={model} resultIndex={resultIndex} />
    </table-header>
  );
});
