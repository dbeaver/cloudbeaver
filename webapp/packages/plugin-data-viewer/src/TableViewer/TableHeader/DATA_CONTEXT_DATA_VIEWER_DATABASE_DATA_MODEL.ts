/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createDataContext } from '@cloudbeaver/core-view';

import type { IDatabaseDataModel } from '../../DatabaseDataModel/IDatabaseDataModel';
import type { IDatabaseDataOptions } from '../../DatabaseDataModel/IDatabaseDataOptions';

export const DATA_CONTEXT_DATA_VIEWER_DATABASE_DATA_MODEL = createDataContext<IDatabaseDataModel<IDatabaseDataOptions, any>>('data-viewer-database-data-model');
