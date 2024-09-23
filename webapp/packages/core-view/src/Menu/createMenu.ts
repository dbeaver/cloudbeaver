/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IAction } from '../Action/IAction.js';
import type { IMenu } from './IMenu.js';

const menuSymbol = Symbol('@menu');

export function createMenu(id: string, label: string, icon?: string, tooltip?: string, action?: IAction): IMenu {
  const menu = {
    id: `@menu/${id}`,
    label,
    icon,
    tooltip,
    action,
  };

  (menu as any)[menuSymbol] = true;

  return menu;
}

export function isMenu(obj: any): obj is IMenu {
  return obj && typeof obj === 'object' && menuSymbol in obj;
}
