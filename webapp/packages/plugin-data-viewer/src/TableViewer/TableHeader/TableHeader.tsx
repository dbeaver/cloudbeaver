/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled, { css } from 'reshadow';

import { Placeholder } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { composes, useStyles } from '@cloudbeaver/core-theming';

import { DataModelWrapper } from '../DataModelWrapper';
import { TableHeaderService } from './TableHeaderService';

const styles = composes(
  css`
    table-header {
      composes: theme-background-secondary theme-text-on-secondary from global;
    }
  `,
  css`
    table-header {
      height: 40px;
      flex: 0 0 auto;
      display: flex;
      align-items: center;
    }
  `
);

type Props = {
  model: DataModelWrapper;
}

export const TableHeader = observer(function TableHeader({
  model,
}: Props) {
  const service = useService(TableHeaderService);

  return styled(useStyles(styles))(
    <table-header as="div">
      <Placeholder container={service.tableHeaderPlaceholder} context={model}/>
    </table-header>
  );
});
