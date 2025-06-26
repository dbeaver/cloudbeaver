/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { Bootstrap } from '@cloudbeaver/core-di';
import type { ClassCollection } from './themeUtils.js';
import type { Style } from './ComponentStyle.js';

export const emptyTheme: ClassCollection = {};

export enum THEME_OPTIONS_ID {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system',
}

export interface IThemeService extends Bootstrap {
  theme: ITheme;
  themeId: THEME_ID;
}

export type ThemeLoadersMap = Map<
  THEME_ID,
  Promise<{
    default: typeof import('*.scss');
  }>
>;

export interface ITheme {
  name: string;
  id: THEME_OPTIONS_ID;
  styles?: ClassCollection; // will be populated after execution ITheme.loader()
  getLoadersMap: () => ThemeLoadersMap;
}

export interface IStyleRegistry {
  mode: 'replace' | 'append';
  styles: Style[];
}

export type THEME_ID = 'light' | 'dark';
export const DEFAULT_THEME_ID = THEME_OPTIONS_ID.SYSTEM;
export const UNKNOWN_SYSTEM_THEME_FALLBACK: THEME_ID = 'light';
