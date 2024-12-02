/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { TabContainerPanelComponent } from '@cloudbeaver/core-ui';
import { type IDataValuePanelProps, isResultSetDataModel } from '@cloudbeaver/plugin-data-viewer';

import { GISValuePresentation } from './GISValuePresentation.js';

export const GISViewer: TabContainerPanelComponent<IDataValuePanelProps> = function GISViewer({ model: unknownModel, resultIndex }) {
  const model = unknownModel as any;
  if (!isResultSetDataModel(model)) {
    throw new Error('GISViewer can only be used with ResultSetDataSource');
  }

  return <GISValuePresentation model={model} resultIndex={resultIndex} />;
};
