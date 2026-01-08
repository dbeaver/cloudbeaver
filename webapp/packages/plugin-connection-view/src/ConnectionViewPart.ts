/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ConnectionInfoResource, createConnectionParam, DEFAULT_NAVIGATOR_VIEW_SETTINGS } from '@cloudbeaver/core-connections';
import type { NavigatorViewSettings } from '@cloudbeaver/core-root';
import { FormPart, type IFormState } from '@cloudbeaver/core-ui';
import type { ProjectInfoResource } from '@cloudbeaver/core-projects';
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
    private readonly connectionInfoResource: ConnectionInfoResource,
    private readonly connectionViewService: ConnectionViewService,
    private readonly projectInfoResource: ProjectInfoResource,
    private readonly connectionViewResource: ConnectionViewResource,
  ) {
    super(formState, defaultStateGetter());
  }

  override isOutdated(): boolean {
    if (!this.optionsPart.connectionKey) {
      return false;
    }

    return this.connectionViewResource.isOutdated(this.optionsPart.connectionKey);
  }

  protected override async loader(): Promise<void> {
    if (!this.optionsPart.connectionKey) {
      this.setInitialState(defaultStateGetter());
      return;
    }

    // THIS IS ONLY FOR USER SETTINGS, WE SHOULD LOAD GLOBAL SETTINGS FROM SOMEWHERE ELSE
    const connection = await this.connectionViewResource.load(this.optionsPart.connectionKey);
    this.setInitialState({ ...connection.navigatorSettings });
  }

  protected override async saveChanges(data: IFormState<IConnectionFormState>): Promise<void> {
    if (!this.optionsPart.connectionKey) {
      return;
    }

    // if the project is not shared, we save settings on the user level
    const connection = await this.connectionInfoResource.load(this.optionsPart.connectionKey);
    const isShared = this.projectInfoResource.isProjectShared(connection.projectId);

    await this.connectionViewService.changeConnectionView(createConnectionParam(connection), {
      ...this.state,
      userSettings: !isShared,
    });
  }
}
