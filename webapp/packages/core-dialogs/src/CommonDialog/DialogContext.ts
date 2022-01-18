/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createContext } from 'react';

import type { DialogInternal } from './CommonDialogService';

export interface IDialogContext {
  visible: boolean;
  dialog: DialogInternal<any>;
  reject: () => void;
}

export const DialogContext = createContext<IDialogContext>(undefined as any);
