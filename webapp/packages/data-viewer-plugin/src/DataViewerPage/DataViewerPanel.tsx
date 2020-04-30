/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ObjectPagePanelProps } from '@dbeaver/object-viewer-plugin';

import { TableViewer } from '../TableViewer/TableViewer';

export const DataViewerPanel = function DataViewerPanel({
  tab,
}: ObjectPagePanelProps) {

  return <TableViewer tableId={tab.id}/>;
};
