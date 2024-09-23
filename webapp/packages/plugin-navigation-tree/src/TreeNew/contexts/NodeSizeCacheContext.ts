/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createContext } from 'react';

import type { INodeSizeCache } from '../useNodeSizeCache.js';

export const NodeSizeCacheContext = createContext<INodeSizeCache | undefined>(undefined);
