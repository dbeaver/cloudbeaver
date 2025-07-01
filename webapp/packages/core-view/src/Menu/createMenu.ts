/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IMenu } from './IMenu.js';
import type { IMenuInfo } from './IMenuInfo.js';

const menuSymbol = Symbol('@menu');

export function createMenu(id: string, info: IMenuInfo): IMenu {
  const menu = {
    id: `@menu/${id}`,
    info,
  };

  (menu as any)[menuSymbol] = true;

  return menu;
}

export function isMenu(obj: any): obj is IMenu {
  return obj && typeof obj === 'object' && menuSymbol in obj;
}
