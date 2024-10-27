/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, makeObservable, observable } from 'mobx';

import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { injectable } from '@cloudbeaver/core-di';
import { Executor, type IExecutor } from '@cloudbeaver/core-executor';
import { OptionsPanelService } from '@cloudbeaver/core-ui';

const TeamsTableOptionsPanel = importLazyComponent(() => import('./TeamsTableOptionsPanel.js').then(m => m.TeamsTableOptionsPanel));
const panelGetter = () => TeamsTableOptionsPanel;

@injectable()
export class TeamsTableOptionsPanelService {
  teamId: string | null;

  readonly onClose: IExecutor;

  constructor(private readonly optionsPanelService: OptionsPanelService) {
    this.teamId = null;
    this.onClose = new Executor();

    this.optionsPanelService.closeTask.next(this.onClose, undefined, () => this.optionsPanelService.isOpen(panelGetter));
    this.close = this.close.bind(this);

    makeObservable(this, {
      teamId: observable.ref,
      open: action,
      close: action,
    });
  }

  async open(teamId: string): Promise<boolean> {
    if (this.optionsPanelService.isOpen(panelGetter)) {
      return true;
    }

    const state = await this.optionsPanelService.open(panelGetter);

    if (state) {
      this.teamId = teamId;
    }

    return state;
  }

  async close(): Promise<void> {
    if (!this.optionsPanelService.isOpen(panelGetter)) {
      return;
    }

    const result = await this.optionsPanelService.close();

    if (result) {
      this.teamId = null;
    }
  }
}
