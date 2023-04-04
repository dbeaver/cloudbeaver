/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { ClassCollection } from './themeUtils';

export type BaseStyles = ClassCollection;
export type ThemeSelector = (theme: string) => Promise<undefined | BaseStyles | BaseStyles[]>;
export type Style = BaseStyles | ThemeSelector;
export type DynamicStyle = Style | boolean | undefined;
export type ComponentStyle = DynamicStyle | DynamicStyle[] | DynamicStyle[][];