/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { DatabaseObjectInfo, NavigatorNodeInfo } from '@dbeaver/core/sdk';

// Node Info without ObjectProperties
export type NavigatorNodeInfoLight = Omit<NavigatorNodeInfo, 'object'> & {
  object?: {
    features?: string[]; // EObjectFeature
  };
}

export type NodeWithParent = NavigatorNodeInfoLight & {
  parentId: string;
}

export type DatabaseObjectInfoWithId = DatabaseObjectInfo & {
  id: string;
}

export type NodeChildren = {
  children: string[];
  isLoaded: boolean;
}
