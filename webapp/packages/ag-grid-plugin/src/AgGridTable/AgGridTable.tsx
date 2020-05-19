/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Module } from 'ag-grid-community';
import { AgGridReactProps } from 'ag-grid-react';
import { observer, Observer } from 'mobx-react';
import { PropsWithChildren } from 'react';
import styled from 'reshadow';

import { ComplexLoader, Loader } from '@dbeaver/core/blocks';
import { useController } from '@dbeaver/core/di';
import { useStyles } from '@dbeaver/core/theming';

import { RangeSelectionModule } from '../modules/RangeSelection/rangeSelectionModule';
import { agGridStyles } from '../styles/styles';
import { AgGridTableController } from './AgGridTableController';
import { IAgGridModel } from './IAgGridModel';
import { LoadingCell } from './LoadingCell';
import { PlainTextEditor } from './PlainTextEditor/PlainTextEditor';
import { TableColumnHeader } from './TableColumnHeader/TableColumnHeader';

export type AgGridTableProps = PropsWithChildren<
  AgGridReactProps & {
    tableModel: IAgGridModel;
    className?: string;
  }>

async function loader() {
  const styles = await import('../styles/base.scss');
  const { AgGridReact } = await import('ag-grid-react');
  const { AllCommunityModules } = await import('@ag-grid-community/all-modules');

  return { AgGridReact, AllCommunityModules: [...AllCommunityModules, RangeSelectionModule] };
}

const agGridComponents = {
  agColumnHeader: TableColumnHeader,
  plainTextEditor: PlainTextEditor,
  loadingCellRenderer: LoadingCell,
};

export const AgGridTable = observer(function AgGridTable({
  tableModel,
  className,
  ...rest
}: AgGridTableProps) {
  const styles = useStyles(agGridStyles);
  const controller = useController(AgGridTableController, tableModel);

  return (
    <ComplexLoader
      loader={loader}
      placeholder={<Loader />}
    >
      {({ AgGridReact, AllCommunityModules }) => (
        <Observer>
          {() => styled(styles)(
            <ag-grid-theme as="div" className={`cb-ag-grid-theme ${className}`}>
              <AgGridReact
                key={controller.refreshId}
                columnDefs={controller.columns}
                gridOptions={controller.getGridOptions()}
                modules={AllCommunityModules as Module[]}
                frameworkComponents={agGridComponents}
                loadingCellRenderer="loadingCellRenderer"
                {...controller.dynamicOptions}
                {...rest}
              />
            </ag-grid-theme>
          )}
        </Observer>
      )}
    </ComplexLoader>
  );
});
