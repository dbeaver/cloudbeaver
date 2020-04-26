/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export interface IObjectViewerTabState {
  objectId: string;
  folderId: string;
  pageId: string;
  pagesState: Map<string, any>;
}
