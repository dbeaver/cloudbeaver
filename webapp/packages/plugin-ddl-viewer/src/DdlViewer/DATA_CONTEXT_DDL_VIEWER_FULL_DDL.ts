/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createDataContext } from '@cloudbeaver/core-data-context';

export interface IDdlViewerFullDdlState {
  value: boolean;
  loading: boolean;
  onChange: (value: boolean) => void;
}

export const DATA_CONTEXT_DDL_VIEWER_FULL_DDL = createDataContext<IDdlViewerFullDdlState>('ddl-full-ddl');
