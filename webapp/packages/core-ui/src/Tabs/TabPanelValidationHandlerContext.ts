/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { MutableRefObject, createContext } from 'react';

export interface ITabPanelValidationHandlerContext {
  invalidTabs: MutableRefObject<Set<string>>;
  validate: (tabId: string) => void;
}

export const TabPanelValidationHandlerContext = createContext<ITabPanelValidationHandlerContext | null>(null);