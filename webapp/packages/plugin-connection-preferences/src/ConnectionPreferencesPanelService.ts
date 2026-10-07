/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, makeObservable, observable } from 'mobx';

import { importLazyComponent } from '@cloudbeaver/core-blocks';
import type { IConnectionInfoParams } from '@cloudbeaver/core-connections';
import { injectable, IServiceProvider } from '@cloudbeaver/core-di';
import type { IExecutorHandler } from '@cloudbeaver/core-executor';
import { FormMode, OptionsPanelService, type OptionsPanelCloseEventData } from '@cloudbeaver/core-ui';

import { ConnectionPreferencesFormState } from './ConnectionPreferencesForm/ConnectionPreferencesFormState.js';
import { ConnectionPreferencesFormService } from './ConnectionPreferencesForm/ConnectionPreferencesFormService.js';

const ConnectionPreferencesPanel = importLazyComponent(() => import('./ConnectionPreferencesPanel.js').then(m => m.ConnectionPreferencesPanel));

const formGetter = () => ConnectionPreferencesPanel;

@injectable(() => [OptionsPanelService, IServiceProvider, ConnectionPreferencesFormService])
export class ConnectionPreferencesPanelService {
  formState: ConnectionPreferencesFormState | null;

  constructor(
    private readonly optionsPanelService: OptionsPanelService,
    private readonly serviceProvider: IServiceProvider,
    private readonly connectionPreferencesFormService: ConnectionPreferencesFormService,
  ) {
    this.formState = null;
    this.optionsPanelService.closeTask.addHandler(this.closeHandler);

    makeObservable(this, {
      formState: observable.shallow,
      open: action,
      close: action,
    });
  }

  async open(connectionKey: IConnectionInfoParams): Promise<boolean> {
    const opened = await this.optionsPanelService.open(formGetter);

    if (opened) {
      this.formState?.dispose();
      this.formState = new ConnectionPreferencesFormState(this.serviceProvider, this.connectionPreferencesFormService, {
        projectId: connectionKey.projectId,
        connectionId: connectionKey.connectionId,
      }).setMode(FormMode.Edit);
    }

    return opened;
  }

  async close(): Promise<void> {
    await this.optionsPanelService.close();
  }

  private readonly closeHandler: IExecutorHandler<OptionsPanelCloseEventData> = event => {
    if (event !== 'after' || !this.optionsPanelService.isOpen(formGetter)) {
      return;
    }

    this.formState?.dispose();
    this.formState = null;
  };
}
