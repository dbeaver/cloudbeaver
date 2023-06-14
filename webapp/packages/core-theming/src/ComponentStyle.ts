/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { ClassCollection } from './themeUtils';

export type BaseStyles<T extends Record<string, string> = Record<string, string>> = ClassCollection<T>;
export type ThemeSelector<T extends Record<string, string> = Record<string, string>> = (
  theme: string,
) => Promise<undefined | BaseStyles<T> | BaseStyles<T>[]>;
export type Style<T extends Record<string, string> = Record<string, string>> = BaseStyles<T> | ThemeSelector<T>;
export type DynamicStyle<T extends Record<string, string> = Record<string, string>> = Style<T> | boolean | undefined;
export type ComponentStyle<T extends Record<string, string> = Record<string, string>> = DynamicStyle<T> | ComponentStyle<T>[];
