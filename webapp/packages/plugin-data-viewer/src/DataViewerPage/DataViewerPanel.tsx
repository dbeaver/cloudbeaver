/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';

import { Loader, TextPlaceholder } from '@cloudbeaver/core-blocks';
import type { ObjectPagePanelComponent } from '@cloudbeaver/plugin-object-viewer';

import type { IDataViewerPageState } from '../IDataViewerPageState';
import { TableViewer } from '../TableViewer/TableViewer';
import { useDataViewerDatabaseDataModel } from './useDataViewerDatabaseDataModel';

export const DataViewerPanel: ObjectPagePanelComponent<IDataViewerPageState> = observer(function DataViewerPanel({
  tab,
  page,
}) {
  const dataViewerDatabaseDataModel = useDataViewerDatabaseDataModel(tab);
  const pageState = page.getState(tab);

  const handlePresentationChange = useCallback((presentationId: string) => {
    const pageState = page.getState(tab);

    if (!pageState) {
      page.setState(tab, {
        presentationId,
        resultIndex: 0,
        valuePresentationId: null,
      });
    } else {
      pageState.presentationId = presentationId;
    }
  }, [page, tab]);

  const handleValuePresentationChange = useCallback((valuePresentationId: string | null) => {
    const pageState = page.getState(tab);

    if (!pageState) {
      page.setState(tab, {
        presentationId: '',
        resultIndex: 0,
        valuePresentationId,
      });
    } else {
      pageState.valuePresentationId = valuePresentationId;
    }
  }, [page, tab]);

  if (!tab.handlerState.tableId) {
    return <TextPlaceholder>Table model not loaded</TextPlaceholder>;
  }

  return (
    <Loader state={dataViewerDatabaseDataModel}>
      {tab.handlerState.tableId ? (
        <TableViewer
          tableId={tab.handlerState.tableId}
          resultIndex={pageState?.resultIndex}
          presentationId={pageState?.presentationId}
          valuePresentationId={pageState?.valuePresentationId}
          onPresentationChange={handlePresentationChange}
          onValuePresentationChange={handleValuePresentationChange}
        />
      ) : (
        <TextPlaceholder>Table model not loaded</TextPlaceholder>
      )}
    </Loader>
  );
});
