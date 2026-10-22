/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2019-2026 DBeaver Corp
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { AiDatabaseScope } from '@cloudbeaver/core-sdk';
import { FormPart, formSubmitContext, type IFormState } from '@cloudbeaver/core-ui';
import type { ConnectionInfoAiResource } from '../../ConnectionInfoAiResource.js';
import type { ConnectionFormOptionsPart, IConnectionFormState } from '@cloudbeaver/plugin-connections';

export class ConnectionAiScopePart extends FormPart<{ scope: AiDatabaseScope; customObjectIds: string[] }, IConnectionFormState> {
  constructor(
    formState: IFormState<IConnectionFormState>,
    private readonly optionsPart: ConnectionFormOptionsPart,
    private readonly connectionInfoAiResource: ConnectionInfoAiResource,
  ) {
    super(formState, { scope: AiDatabaseScope.CurrentDatasource, customObjectIds: [] });
  }

  override isOutdated(): boolean {
    const key = this.optionsPart.connectionKey;
    return super.isOutdated() || (!!key && this.connectionInfoAiResource.isOutdated(key));
  }

  override isLoaded(): boolean {
    const key = this.optionsPart.connectionKey;
    return super.isLoaded() && (!key || this.connectionInfoAiResource.isLoaded(key));
  }

  protected override async loader(): Promise<void> {
    const key = this.optionsPart.connectionKey;
    const settings = key ? await this.connectionInfoAiResource.load(key) : null;
    this.setInitialState({
      scope: settings?.scope ?? AiDatabaseScope.CurrentDatasource,
      customObjectIds: [...(settings?.customObjectIds ?? [])].sort(),
    });
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
      customObjectIds: this.state.customObjectIds,
    });
  }
}
