/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export interface IObjectViewerTabState {
  tableId?: string;
  connectionId: string | undefined;
  error: boolean;
  childrenError: boolean;
  objectId: string;
  parentId: string;
  parents: string[];
  folderId: string;
  tabIcon?: string;
  tabTitle?: string;
  pageId: string;
  pagesState: Record<string, any>;
}
