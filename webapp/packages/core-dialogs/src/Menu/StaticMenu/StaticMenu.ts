/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IMenuPanel } from '../IMenuPanel';
import {
  ComputedMenuItemModel, IComputedMenuItemOptions
} from '../models/ComputedMenuItemModel';
import { ComputedMenuPanelModel } from '../models/ComputedMenuPanelModel';
import { MenuOptionsStore } from '../models/MenuOptionsStore';

/**
 * this class allows to store IComputedMenuItemOptions in a tree structure
 * and create IMenuPanel from this tree
 */
export class StaticMenu {
  private menuStore = new MenuOptionsStore<IComputedMenuItemOptions>();
  private menuModels = new Map<string, IMenuPanel>();

  addRootPanel(panelId: string): void {
    this.menuStore.addRootPanel(panelId);
  }

  addMenuItem(panelId: string, params: IComputedMenuItemOptions): void {
    this.menuStore.addMenuItem(panelId, params);
  }

  getMenu(panelId: string): IMenuPanel {
    // construct menu model only once
    if (!this.menuModels.has(panelId)) {
      const menuModel = this.constructMenuPanel(panelId);
      this.menuModels.set(panelId, menuModel);
    }
    return this.menuModels.get(panelId)!;
  }

  private constructMenuPanel(panelId: string): IMenuPanel {
    return new ComputedMenuPanelModel({
      id: `${panelId}-panel`,
      menuItemsGetter: () => this.constructMenuItems(panelId),
    });
  }

  private constructMenuItems(panelId: string): ComputedMenuItemModel[] {
    const panel = this.menuStore.getPanel(panelId);
    return panel.menuItems.values.map(item => this.constructMenuItem(item));
  }

  private constructMenuItem(options: IComputedMenuItemOptions): ComputedMenuItemModel {
    const model = new ComputedMenuItemModel(options);

    if (options.isPanel) {
      model.panel = this.constructMenuPanel(options.id);
    }

    return model;
  }
}
