/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, makeObservable } from 'mobx';

import type { IMenuItem, IMenuPanel } from '@cloudbeaver/core-dialogs';
import type { TLocalizationToken } from '@cloudbeaver/core-localization';

import type { IMenuItemOptions } from './MenuOptionsStore';

export interface IComputedMenuItemOptions extends IMenuItemOptions {
  onClick?: () => void;
  isDisabled?: () => boolean;
  isHidden?: () => boolean;
}

export class ComputedMenuItemModel implements IMenuItem {
  id: string;
  onClick?: () => void;
  panel?: IMenuPanel;
  rtl?: boolean;

  get title(): TLocalizationToken {
    if (this.options.title) {
      return this.options.title;
    }
    return this.options.titleGetter ? this.options.titleGetter() || '' : '';
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

  constructor(private options: IComputedMenuItemOptions) {
    makeObservable(this, {
      title: computed,
      isDisabled: computed,
      icon: computed,
      isHidden: computed,
    });

    this.id = options.id;
    this.rtl = options.rtl;
    this.panel = options.panel;
    this.onClick = this.options.onClick;
  }
}
