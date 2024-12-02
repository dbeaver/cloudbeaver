/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { SelectionRange } from '@codemirror/state';

import type { IHyperlinkInfo } from './IHyperlinkInfo.js';

export type HyperlinkLoader = (pos: SelectionRange) => Promise<IHyperlinkInfo | null>;
