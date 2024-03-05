/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { TabContainerPanelComponent } from '@cloudbeaver/core-ui';
import type { IDatabaseResultSet, IDataValuePanelProps } from '@cloudbeaver/plugin-data-viewer';

import { GISValuePresentation } from './GISValuePresentation';

export const GISViewer: TabContainerPanelComponent<IDataValuePanelProps<any, IDatabaseResultSet>> = function GISViewer({ model, resultIndex }) {
  return <GISValuePresentation model={model} resultIndex={resultIndex} />;
};
