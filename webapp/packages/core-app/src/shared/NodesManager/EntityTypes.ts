/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { NavigatorNodeInfo, NavNodeDbObjectInfoFragment } from '@cloudbeaver/core-sdk';

export type NavNodeInfo = NavigatorNodeInfo;

export type NavNode = Omit<NavNodeInfo, 'object'> & {
  parentId: string;
  fullName?: string;
  objectFeatures: string[];
};

export type DBObject = NavNodeDbObjectInfoFragment;
