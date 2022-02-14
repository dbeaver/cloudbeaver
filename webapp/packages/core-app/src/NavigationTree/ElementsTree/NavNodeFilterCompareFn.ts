/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { NavNode } from '../../shared/NodesManager/EntityTypes';

export enum EEquality {
  none,
  partially,
  full
}

export type NavNodeFilterCompareFn = (node: NavNode, filter: string)=> EEquality;