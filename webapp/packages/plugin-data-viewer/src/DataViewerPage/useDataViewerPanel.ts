/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { ConnectionInfoResource } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { NavNodeManagerService } from '@cloudbeaver/core-navigation-tree';
import type { ITab } from '@cloudbeaver/plugin-navigation-tabs';
import type { IObjectViewerTabState } from '@cloudbeaver/plugin-object-viewer';

import { DataPresentationService } from '../DataPresentationService';
import { DataViewerDataChangeConfirmationService } from '../DataViewerDataChangeConfirmationService';
import { DataViewerTableService } from '../DataViewerTableService';
import { DataViewerTabService } from '../DataViewerTabService';
import { TableViewerStorageService } from '../TableViewer/TableViewerStorageService';
import { useDataViewerModel } from '../useDataViewerModel';

export function useDataViewerPanel(tab: ITab<IObjectViewerTabState>) {
  const dataViewerTableService = useService(DataViewerTableService);
  const tableViewerStorageService = useService(TableViewerStorageService);
  const navNodeManagerService = useService(NavNodeManagerService);
  const dataViewerTabService = useService(DataViewerTabService);
  const connectionInfoResource = useService(ConnectionInfoResource);
  const dataPresentationService = useService(DataPresentationService);
  const dataViewerDataChangeConfirmationService = useService(DataViewerDataChangeConfirmationService);

  const model = useDataViewerModel(
    tab.handlerState.connectionKey,
    async () => {
      const node = navNodeManagerService.getNode({
        nodeId: tab.handlerState.objectId,
        parentId: tab.handlerState.parentId,
      });

      if (!navNodeManagerService.isNodeHasData(node)) {
        return;
      }

      let model = tableViewerStorageService.get(tab.handlerState.tableId || '');

      if (model && !model.source.executionContext?.context && model.source.results.length > 0) {
        model.resetData();
      }

      if (!model) {
        await connectionInfoResource.waitLoad();
        const connectionInfo = connectionInfoResource.get(tab.handlerState.connectionKey!);

        if (!connectionInfo) {
          throw new Error("Connection doesn't exists");
        }

        model = dataViewerTableService.create(connectionInfo, node);
        tab.handlerState.tableId = model.id;
        model.source.setOutdated();
        dataViewerDataChangeConfirmationService.trackTableDataUpdate(model.id);

        const pageState = dataViewerTabService.page.getState(tab);

        if (pageState) {
          const presentation = dataPresentationService.get(pageState.presentationId);

          if (presentation?.dataFormat !== undefined) {
            model.setDataFormat(presentation.dataFormat);
          }
        }
      }

      if (node?.name) {
        model.setName(node.name);
      }
    },
    tab.handlerState.tableId,
  );

  return model;
}
