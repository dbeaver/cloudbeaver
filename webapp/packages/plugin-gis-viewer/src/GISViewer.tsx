/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { TabContainerPanelComponent } from '@cloudbeaver/core-blocks';
import type { IDataValuePanelProps, IDatabaseResultSet } from '@cloudbeaver/plugin-data-viewer';

import { GISValuePresentationLoader } from './GISValuePresentationLoader';

export const GISViewer: TabContainerPanelComponent<IDataValuePanelProps<any, IDatabaseResultSet>> = function GISViewer({ model, resultIndex }) {
  return (
    <GISValuePresentationLoader model={model} resultIndex={resultIndex} />
  );
}
;
