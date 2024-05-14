/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { lazy } from 'react';

export const HideAppLoadingScreen = lazy(() => import('./HideAppLoadingScreen').then(m => ({ default: m.HideAppLoadingScreen })));
