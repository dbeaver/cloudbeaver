/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { componentProviderWrapper } from '../componentProviderWrapper.js';
import { ColorPickerBase } from './ColorPickerBase.js';

export const ColorPicker = componentProviderWrapper('ColorPicker', ColorPickerBase);
