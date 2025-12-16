/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createDataContext } from '@cloudbeaver/core-data-context';

import type { IDataPresentationActions } from './IDataPresentationActions.js';
import type { IGridDataKey } from '../DatabaseDataModel/Actions/Grid/IGridDataKey.js';

export const DATA_CONTEXT_DV_PRESENTATION_ACTIONS = createDataContext<IDataPresentationActions<IGridDataKey>>(
  'data-viewer-database-presentation-actions',
);
