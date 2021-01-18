/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';

import { TextPlaceholder } from '@cloudbeaver/core-blocks';
import type { ObjectPagePanelProps } from '@cloudbeaver/plugin-object-viewer';

import type { IDataViewerPageState } from '../IDataViewerPageState';
import { TableViewer } from '../TableViewer/TableViewer';

export const DataViewerPanel = observer(function DataViewerPanel({
  tab,
  page,
}: ObjectPagePanelProps<IDataViewerPageState>) {
  const pageState = page.getState(tab);

  const handlePresentationChange = useCallback((presentationId: string) => {
    const pageState = page.getState(tab);

    if (!pageState) {
      page.setState(tab, {
        presentationId,
        resultIndex: 0,
      });
    } else {
      pageState.presentationId = presentationId;
    }
  }, [page, tab]);

  if (!tab.handlerState.tableId) {
    return <TextPlaceholder>Table model not loaded</TextPlaceholder>;
  }

  return (
    <TableViewer
      tableId={tab.handlerState.tableId}
      resultIndex={pageState?.resultIndex}
      presentationId={pageState?.presentationId}
      onPresentationChange={handlePresentationChange}
    />
  );
});
