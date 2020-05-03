/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export interface IExportContext {
  connectionId: string;
  contextId?: string;
  containerNodePath?: string;
  resultId?: string | null;
  sourceName?: string;
}
