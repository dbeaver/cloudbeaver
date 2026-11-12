/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { importLazyComponent } from '../importLazyComponent.js';

export const Card = importLazyComponent(() => import('./Card.js').then(m => m.Card));
export const CardHeader = importLazyComponent(() => import('./CardHeader.js').then(m => m.CardHeader));
export const CardTitle = importLazyComponent(() => import('./CardTitle.js').then(m => m.CardTitle));
export const CardSection = importLazyComponent(() => import('./CardSection.js').then(m => m.CardSection));
