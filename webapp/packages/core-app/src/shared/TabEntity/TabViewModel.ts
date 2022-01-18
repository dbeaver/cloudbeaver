/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { ReactElement } from 'react';

import type { ITab } from '@cloudbeaver/core-ui';
import { Entity, inject, injectable } from '@cloudbeaver/core-di';

import { ITabContainerEntity, TabContainerToken } from './TabContainerToken';
import { TabContext } from './TabContext';
import { TabToken } from './TabToken';

@injectable()
export class TabViewModel implements ITab {
  tabId: string;
  panel: () => ReactElement | null;

  get title(): string {
    return this.tabModel.title;
  }

  get icon(): string | undefined {
    return this.tabModel.icon;
  }

  onClose?: () => void;
  onActivate = () => { this.tabContainer.activateTab(this.tabId); };

  constructor(
    @inject(TabToken) private readonly tabModel: ITab,
    private readonly entity: Entity,
    @inject(TabContainerToken) private readonly tabContainer: ITabContainerEntity
  ) {
    this.tabId = this.entity.id;
    this.onClose = this.tabModel.onClose ? () => { this._onClose(); } : undefined;
    this.panel = () => TabContext(tabContainer.getTabServiceInjector(this.tabId), this.tabModel.panel);
  }

  private _onClose() {
    this.tabContainer.closeTab(this.tabId);
  }
}
