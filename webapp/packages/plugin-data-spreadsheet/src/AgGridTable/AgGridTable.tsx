/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import { useEffect, useMemo, useRef } from 'react';
import styled from 'reshadow';

import { Module } from '@ag-grid-community/core';
import { AgGridReactProps } from '@ag-grid-community/react';
import { useController } from '@cloudbeaver/core-di';
import { useStyles } from '@cloudbeaver/core-theming';
import { TableViewerModel } from '@cloudbeaver/plugin-data-viewer';

import { agGridStyles } from '../styles/styles';
import { AgGridTableController } from './AgGridTableController';
import { IndexCellRenderer } from './IndexCellRenderer';
import { PlainTextEditor } from './PlainTextEditor/PlainTextEditor';
import { TableColumnHeader } from './TableColumnHeader/TableColumnHeader';

const agGridComponents = {
  agColumnHeader: TableColumnHeader,
  plainTextEditor: PlainTextEditor,
  indexCellRenderer: IndexCellRenderer,
};
interface IAgGridTableProps {
  agGridReact: React.FC<AgGridReactProps>;
  tableModel: TableViewerModel;
  className?: string;
  allCommunityModules: Module[];
}

export const AgGridTable: React.FC<IAgGridTableProps> = observer(
  function AgGridTable({
    agGridReact: AgGridReact,
    tableModel,
    className,
    allCommunityModules,
    ...rest
  }) {
    const styles = useStyles(agGridStyles);
    const refreshRef = useRef(0);
    const agGridContainerRef = useRef(null);
    const controller = useController(AgGridTableController, tableModel);
    useMemo(() => refreshRef.current === controller.refreshId && controller.refresh(), [tableModel]);
    refreshRef.current = controller.refreshId;

    useEffect(() => {
      if (agGridContainerRef.current) {
        controller.gridContainer = agGridContainerRef.current;
      }
    }, [controller]);

    return styled(styles)(
      <ag-grid-theme ref={agGridContainerRef} as="div" className={`cb-ag-grid-theme ${className}`}>
        <AgGridReact
          key={controller.refreshId}
          columnDefs={controller.columns}
          gridOptions={controller.getGridOptions()}
          modules={allCommunityModules}
          frameworkComponents={agGridComponents}
          loadingCellRenderer="loadingCellRenderer"
          {...controller.dynamicOptions}
          {...rest}
        />
      </ag-grid-theme>
    );
  });
