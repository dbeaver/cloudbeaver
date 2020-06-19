/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { TLocalizationToken } from '@cloudbeaver/core-localization';
import { uuid } from '@cloudbeaver/core-utils';

import { IMenuPanel } from '../IMenuPanel';
import { ComputedMenuItemModel, IComputedMenuItemOptions } from '../models/ComputedMenuItemModel';
import { MenuOptionsStore } from '../models/MenuOptionsStore';
import { IContextMenuItem } from './IContextMenuItem';
import { IMenuContext } from './IMenuContext';

/**
 * this class allows to store IContextMenuItem in a tree structure
 * and create IMenuPanel from this tree
 */
export class ContextMenu {
  menuStore = new MenuOptionsStore<IContextMenuItem<any>>();

  addRootPanel(panelId: string) {
    this.menuStore.addRootPanel(panelId);
  }

  /**
   * note that you can add items with different content type in one menu panel
   * just verify content type in IContextMenuItem.isPresent to show menu item in certain context
   *
   */
  addMenuItem(panelId: string, params: IContextMenuItem<any>) {
    this.menuStore.addMenuItem(panelId, params);
  }

  constructMenuWithContext<T>(panelId: string, context: IMenuContext<T>): IMenuPanel {
    context.contextId = context.contextId || uuid();
    return this.constructMenuPanelWithContext(panelId, context);
  }

  private constructMenuItemWithContext<T>(
    params: IContextMenuItem<T>,
    context: IMenuContext<T>
  ): ComputedMenuItemModel {

    // depends on context
    const modelOptions = new ComputedMenuItemOptionsWithContext(params, context);
    const model = new ComputedMenuItemModel(modelOptions);

    if (params.isPanel) {
      model.panel = this.constructMenuPanelWithContext<T>(params.id, context);
    }

    return model;
  }

  private constructMenuPanelWithContext<T>(
    panelId: string,
    context: IMenuContext<T>
  ): IMenuPanel {

    const panel = this.menuStore.getPanel(panelId);
    return new ContextMenuPanel(
      `${panelId}-${context.contextId!}-panel`,
      () => this.constructMenuItems(panel.menuItems.values, context)
    );

  }

  private constructMenuItems<T>(
    menuItems: IContextMenuItem<any>[],
    context: IMenuContext<T>
  ): ComputedMenuItemModel[] {

    return menuItems
      .filter(item => item.isPresent(context)) // show menu items based on context
      .map(item => this.constructMenuItemWithContext(item, context));
  }
}

/**
 * This is helper class and is in use only inside the class ContextRootMenu<T>
 */
class ComputedMenuItemOptionsWithContext<T> implements IComputedMenuItemOptions {
  id: string;
  onClick?: () => void;
  // set title or getter
  title?: TLocalizationToken;
  titleGetter?: () => TLocalizationToken | undefined;
  isDisabled?: () => boolean;
  isHidden?: () => boolean;
  // set icon or getter
  icon?: string;
  iconGetter?: () => string | undefined;

  constructor(private options: IContextMenuItem<T>,
              private context: IMenuContext<T>) {
    // doesn't depend on context
    this.title = options.title;
    this.titleGetter = options.titleGetter;
    this.icon = options.icon;
    this.iconGetter = options.iconGetter;

    this.id = `${options.id}-${context.contextId!}`;

    if (options.onClick) {
      this.onClick = () => options.onClick!(this.context);
    }
    if (options.isDisabled) {
      this.isDisabled = () => options.isDisabled!(this.context);
    }
    if (options.isHidden) {
      this.isHidden = () => options.isHidden!(this.context);
    }
  }
}

class ContextMenuPanel implements IMenuPanel {

  get menuItems() {
    if (!this.items) {
      this.items = this.itemsGetter();
    }
    return this.items;
  }

  private items?: ComputedMenuItemModel[];

  constructor(public id: string,
              private itemsGetter: () => ComputedMenuItemModel[]) {
  }
}
