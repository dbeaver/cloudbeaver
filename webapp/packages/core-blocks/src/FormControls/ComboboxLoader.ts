/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { importLazyComponent } from '../importLazyComponent.js';

export const Combobox = importLazyComponent(() => import('./Combobox.js').then(m => m.Combobox));
