/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2019-2026 DBeaver Corp
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { AiDatabaseScope } from '@cloudbeaver/core-sdk';
import { FormPart, formSubmitContext, formValidationContext, type IFormState } from '@cloudbeaver/core-ui';
import type { ConnectionInfoAiResource } from '../../ConnectionInfoAiResource.js';
import type { ConnectionInfoAiScopeResource } from '../../ConnectionInfoAiScopeResource.js';
import type { ConnectionInfoResource } from '@cloudbeaver/core-connections';
import type { ConnectionFormOptionsPart, IConnectionFormState } from '@cloudbeaver/plugin-connections';

export class ConnectionAiScopePart extends FormPart<{ scope: AiDatabaseScope; customObjectIds: string[] }, IConnectionFormState> {
  constructor(
    formState: IFormState<IConnectionFormState>,
    private readonly optionsPart: ConnectionFormOptionsPart,
    private readonly connectionInfoAiResource: ConnectionInfoAiResource,
    private readonly connectionInfoAiScopeResource: ConnectionInfoAiScopeResource,
    private readonly connectionInfoResource: ConnectionInfoResource,
  ) {
    super(formState, { scope: AiDatabaseScope.CurrentDatasource, customObjectIds: [] });
  }

  override isOutdated(): boolean {
    const key = this.optionsPart.connectionKey;

    if (super.isOutdated()) {
      return true;
    }

    if (key) {
      if (this.connectionInfoAiResource.isOutdated(key)) {
        return true;
      }

      if (this.connectionInfoResource.isConnected(key)) {
        return this.connectionInfoAiScopeResource.isOutdated(key);
      }
    }

    return false;
  }

  override isLoaded(): boolean {
    const key = this.optionsPart.connectionKey;

    if (!super.isLoaded()) {
      return false;
    }

    if (key) {
      if (!this.connectionInfoAiResource.isLoaded(key)) {
        return false;
      }

      if (this.connectionInfoResource.isConnected(key)) {
        return this.connectionInfoAiScopeResource.isLoaded(key);
      }
    }

    return true;
  }

  protected override async loader(): Promise<void> {
    const key = this.optionsPart.connectionKey;
    let scope = AiDatabaseScope.CurrentDatasource;
    let customObjectIds = this.initialState.customObjectIds;

    if (key) {
      const settings = await this.connectionInfoAiResource.load(key);
      scope = settings?.scope ?? AiDatabaseScope.CurrentDatasource;

      if (this.connectionInfoResource.isConnected(key)) {
        const connectionScope = await this.connectionInfoAiScopeResource.load(key);

        if (connectionScope && this.connectionInfoResource.isConnected(key)) {
          customObjectIds = [...(connectionScope.customObjectIds ?? [])].sort();
        }
      }
    }

    this.setInitialState({ scope, customObjectIds });
  }

  protected override validate(
    data: IFormState<IConnectionFormState>,
    contexts: IExecutionContextProvider<IFormState<IConnectionFormState>>,
  ): void {
    const key = this.optionsPart.connectionKey;

    if (key && this.isChanged && !this.connectionInfoResource.isConnected(key)) {
      contexts.getContext(formValidationContext).error('plugin_ai_scope_connect_before_save');
    }
  }

  protected override async saveChanges(
    data: IFormState<IConnectionFormState>,
    contexts: IExecutionContextProvider<IFormState<IConnectionFormState>>,
  ): Promise<void> {
    const key = this.optionsPart.connectionKey;

    if (!key || contexts.getContext(formSubmitContext).type === 'test') {
      return;
    }

    await this.connectionInfoAiResource.save(key, {
      scope: this.state.scope,
      customObjectIds: this.connectionInfoResource.isConnected(key) ? this.state.customObjectIds : undefined,
    });
  }
}
