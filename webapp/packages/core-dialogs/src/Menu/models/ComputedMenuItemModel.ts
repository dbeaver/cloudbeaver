/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed } from 'mobx';

import { IMenuItem, IMenuPanel } from '@cloudbeaver/core-dialogs';
import { TLocalizationToken } from '@cloudbeaver/core-localization';

import { IMenuItemOptions } from './MenuOptionsStore';

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

  @computed get title(): TLocalizationToken {
    if (this.options.title) {
      return this.options.title;
    }
    return this.options.titleGetter ? this.options.titleGetter() || '' : '';
  }
  @computed get isDisabled() {
    return this.options.isDisabled ? this.options.isDisabled() : false;
  }
  @computed get icon() {
    if (this.options.icon) {
      return this.options.icon;
    }
    return this.options.iconGetter ? this.options.iconGetter() : undefined;
  }

  @computed get isHidden(): boolean {
    return this.options.isHidden ? this.options.isHidden() : false;
  }

  constructor(private options: IComputedMenuItemOptions) {
    this.id = options.id;
    this.rtl = options.rtl;
    this.panel = options.panel;
    this.onClick = this.options.onClick;
  }
}
