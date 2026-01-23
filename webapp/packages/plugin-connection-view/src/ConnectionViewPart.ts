/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { type NavigatorViewSettings, DEFAULT_NAVIGATOR_VIEW_SETTINGS, DefaultNavigatorSettingsResource } from '@cloudbeaver/core-root';
import { FormPart, type IFormState } from '@cloudbeaver/core-ui';
import type { ConnectionFormOptionsPart, IConnectionFormState } from '@cloudbeaver/plugin-connections';

import type { ConnectionViewService } from './ConnectionViewService.js';
import type { ConnectionViewResource } from './ConnectionViewResource.js';

export type ConnectionViewPartState = Required<Omit<NavigatorViewSettings, 'userSettings'>>;

function defaultStateGetter(): ConnectionViewPartState {
  return { ...DEFAULT_NAVIGATOR_VIEW_SETTINGS };
}

export class ConnectionViewPart extends FormPart<ConnectionViewPartState, IConnectionFormState> {
  constructor(
    formState: IFormState<IConnectionFormState>,
    private readonly optionsPart: ConnectionFormOptionsPart,
    private readonly connectionViewService: ConnectionViewService,
    private readonly connectionViewResource: ConnectionViewResource,
    private readonly defaultNavigatorSettingsResource: DefaultNavigatorSettingsResource
  ) {
    super(formState, defaultStateGetter());
  }

  override isOutdated(): boolean {
    if (!this.optionsPart.connectionKey) {
      return this.defaultNavigatorSettingsResource.isOutdated();
    }

    return this.connectionViewResource.isOutdated(this.optionsPart.connectionKey);
  }

  protected override async loader(): Promise<void> {
    if (!this.optionsPart.connectionKey) {
      const defaults = await this.defaultNavigatorSettingsResource.load();
      this.setInitialState(defaults ? { ...defaults } : defaultStateGetter());
      return;
    }

    const settings = await this.connectionViewResource.load(this.optionsPart.connectionKey);
    this.setInitialState({ ...settings.defaultNavigatorSettings });
  }

  protected override async saveChanges(data: IFormState<IConnectionFormState>): Promise<void> {
    if (!this.optionsPart.connectionKey) {
      return;
    }

    await this.connectionViewService.changeConnectionView(this.optionsPart.connectionKey, {
      ...this.state,
      userSettings: false,
    });
  }
}
