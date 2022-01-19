/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, makeObservable } from 'mobx';

import type { TLocalizationToken } from '@cloudbeaver/core-localization';

import type { IMenuItem, IMenuPanel } from '../IMenuPanel';
import type { IMenuItemOptions, MenuItemType } from './MenuOptionsStore';

export interface IComputedMenuItemOptions extends IMenuItemOptions {
  onClick?: () => void;
  onMouseEnter?: () => void;
  isDisabled?: () => boolean;
  isHidden?: () => boolean;
  isProcessing?: () => boolean;
  isPanelAvailable?: () => boolean;
  isChecked?: () => boolean;
}

export class ComputedMenuItemModel implements IMenuItem {
  id: string;
  onClick?: () => void;
  onMouseEnter?: () => void;
  panel?: IMenuPanel;
  type?: MenuItemType;
  separator?: boolean;
  keepMenuOpen?: boolean;
  rtl?: boolean;

  get title(): TLocalizationToken {
    if (this.options.title) {
      return this.options.title;
    }
    return this.options.titleGetter ? this.options.titleGetter() || '' : '';
  }

  get tooltip() {
    if (this.options.tooltip) {
      return this.options.tooltip;
    }
    return this.options.tooltipGetter ? this.options.tooltipGetter() : undefined;
  }

  get isDisabled() {
    return this.options.isDisabled ? this.options.isDisabled() : false;
  }

  get icon() {
    if (this.options.icon) {
      return this.options.icon;
    }
    return this.options.iconGetter ? this.options.iconGetter() : undefined;
  }

  get isHidden(): boolean {
    return this.options.isHidden ? this.options.isHidden() : false;
  }

  get isProcessing(): boolean {
    return this.options.isProcessing ? this.options.isProcessing() : false;
  }

  get isPanelAvailable(): boolean | undefined {
    return this.options.isPanelAvailable ? this.options.isPanelAvailable() : undefined;
  }

  get isChecked(): boolean {
    return this.options.isChecked ? this.options.isChecked() : false;
  }

  constructor(private options: IComputedMenuItemOptions) {
    makeObservable(this, {
      title: computed,
      tooltip: computed,
      isDisabled: computed,
      icon: computed,
      isHidden: computed,
      isProcessing: computed,
      isPanelAvailable: computed,
      isChecked: computed,
    });

    this.id = options.id;
    this.type = options.type;
    this.keepMenuOpen = options.keepMenuOpen;
    this.separator = options.separator;
    this.rtl = options.rtl;
    this.panel = options.panel;
    this.onClick = this.options.onClick;
    this.onMouseEnter = this.options.onMouseEnter;
  }
}
