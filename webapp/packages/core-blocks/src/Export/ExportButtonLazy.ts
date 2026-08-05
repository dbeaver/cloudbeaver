/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { importLazyComponent } from '../importLazyComponent.js';

export const ExportButton = importLazyComponent(() => import('./ExportButton.js').then(m => m.ExportButton));

export type { IExportButtonProps } from './ExportButton.js';
