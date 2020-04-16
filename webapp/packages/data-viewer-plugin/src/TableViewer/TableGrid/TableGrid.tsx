/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import { PropsWithChildren } from 'react';
import styled, { css } from 'reshadow';

import { AgGridTable } from '@dbeaver/ag-grid-plugin';
import { Button } from '@dbeaver/core/blocks';

import { TableViewerModel } from '../TableViewerModel';

type TableGridProps = PropsWithChildren<{
  model: TableViewerModel;
}>

const styles = css`
  AgGridTable, no-data, error {
    flex: 1;
  }
  no-data, error {
    white-space: pre-wrap;
    padding: 16px;
  }
`;

export const TableGrid = observer(function TableGrid({
  model,
}: TableGridProps) {

  if (model.errorMessage.length > 0) {
    return styled(styles)(
      <error as="div">
        {model.errorMessage}
        <br/><br/>
        {model.hasDetails && (
          <Button type='button' mod={['outlined']} onClick={model.onShowDetails}>
            Details
          </Button>
        )}
      </error>
    );
  }

  if (model.isFullyLoaded && model.isEmpty) {
    return styled(styles)(<no-data as="div">No data to show</no-data>);
  }

  return styled(styles)(<AgGridTable tableModel={model.agGridModel} />);
});
