/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer, Observer } from 'mobx-react';
import { PropsWithChildren, useMemo, useRef } from 'react';
import styled from 'reshadow';

import { AgGridReactProps } from '@ag-grid-community/react';
import { ComplexLoader, Loader } from '@cloudbeaver/core-blocks';
import { useController } from '@cloudbeaver/core-di';
import { useStyles } from '@cloudbeaver/core-theming';
import { TableViewerModel } from '@cloudbeaver/plugin-data-viewer';

import { agGridStyles } from '../styles/styles';
import { AgGridTableController } from './AgGridTableController';
import { IndexCellRenderer } from './IndexCellRenderer';
import { PlainTextEditor } from './PlainTextEditor/PlainTextEditor';
import { TableColumnHeader } from './TableColumnHeader/TableColumnHeader';

export type AgGridTableProps = PropsWithChildren<
  AgGridReactProps & {
    tableModel: TableViewerModel;
    className?: string;
  }>

async function loader() {
  const styles = await import('../styles/base.scss');
  const { AgGridReact } = await import('@ag-grid-community/react');
  const { InfiniteRowModelModule } = await import('@ag-grid-community/infinite-row-model');
  const { RangeSelectionModule } = await import('./modules/RangeSelection/rangeSelectionModule');

  return { AgGridReact, AllCommunityModules: [InfiniteRowModelModule, RangeSelectionModule] };
}

const agGridComponents = {
  agColumnHeader: TableColumnHeader,
  plainTextEditor: PlainTextEditor,
  indexCellRenderer: IndexCellRenderer,
};

export const AgGridTable = observer(function AgGridTable({
  tableModel,
  className,
  ...rest
}: AgGridTableProps) {
  const refreshRef = useRef(0);
  const styles = useStyles(agGridStyles);
  const controller = useController(AgGridTableController, tableModel);
  useMemo(() => refreshRef.current === controller.refreshId && controller.refresh(), [tableModel]);
  refreshRef.current = controller.refreshId;

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
                modules={AllCommunityModules}
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
