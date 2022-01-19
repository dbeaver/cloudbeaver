/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { TLocalizationToken } from '@cloudbeaver/core-localization';
import { OrderedMap } from '@cloudbeaver/core-utils';

import type { IMenuPanel } from '../IMenuPanel';

const DEFAULT_ITEM_ORDER = 100;

export type MenuItemType = 'checkbox' | 'radio';
export interface IMenuItemOptions {
  id: string;
  // set title or getter
  title?: TLocalizationToken;
  titleGetter?: (...args: any[]) => TLocalizationToken | undefined;
  // set icon or getter
  icon?: string;
  iconGetter?: () => string | undefined;
  tooltip?: string;
  tooltipGetter?: () => TLocalizationToken | undefined;
  order?: number;
  isPanel?: boolean;
  keepMenuOpen?: boolean;
  panel?: IMenuPanel;
  type?: MenuItemType;
  separator?: boolean;
  rtl?: boolean;
}

/**
 * This class store IMenuItemOptions in a set of trees.
 * Items on a certain level of the tree are always ordered.
 * to show menu you need to convert menuItemOptions to MenuItemModels
 */
export class MenuOptionsStore<T extends IMenuItemOptions> {
  private panelsMap: Map<string, MenuItemOptionsList<T>> = new Map();

  addRootPanel(panelId: string) {
    this.createPanelIfNotExists(panelId);
  }

  addMenuItem(panelId: string, params: T) {
    const panel = this.createPanelIfNotExists(panelId);
    if (panel.menuItems.has(params.id)) {
      throw new Error(`Panel "${panelId}" already has item ${params.id}`);
    }

    this.putItemInPanel(panel, params);

    if (params.isPanel) {
      this.createPanelIfNotExists(params.id);
    }
  }

  getPanel(panelId: string): MenuItemOptionsList<T> {
    const panel = this.panelsMap.get(panelId);
    if (!panel) {
      throw new Error(`Menu panel "${panelId}" is missing`);
    }
    return panel;
  }

  private putItemInPanel(panel: MenuItemOptionsList<T>, params: T) {
    panel.menuItems.addValue(params);
    // later sorting may become much more complicated
    // and be based on rules like "item A should be after item B"
    panel.menuItems.sort((a, b) => this.compare(a, b));
  }

  private createPanelIfNotExists(panelId: string): MenuItemOptionsList<T> {
    if (this.panelsMap.has(panelId)) {
      // it means that the panel was created early by some menu item that has been registered in this panel
      return this.panelsMap.get(panelId)!;
    }
    const panel = new MenuItemOptionsList<T>(panelId);
    this.panelsMap.set(panelId, panel);
    return panel;
  }

  private compare(a: IMenuItemOptions, b: IMenuItemOptions): number {
    const orderA = a.order !== undefined ? a.order : DEFAULT_ITEM_ORDER;
    const orderB = b.order !== undefined ? b.order : DEFAULT_ITEM_ORDER;
    return orderA - orderB;
  }
}

class MenuItemOptionsList<T extends IMenuItemOptions> {
  readonly id: string;

  menuItems = new OrderedMap<string, T>(option => option.id);

  constructor(id: string) {
    this.id = id;
  }
}
