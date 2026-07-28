/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { FormPart, formSubmitContext, type IFormState } from '@cloudbeaver/core-ui';
import type { ConnectionFormOptionsPart, IConnectionFormState } from '@cloudbeaver/plugin-connections';
import type { ConnectionInfoAiResource } from '../ConnectionInfoAiResource.js';
import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';
import type { AiDataSourceSettingsInput } from '@cloudbeaver/core-sdk';

type ConnectionAiPartState = AiDataSourceSettingsInput;

function defaultStateGetter(): ConnectionAiPartState {
  return {
    mcpEnabled: false,
    metaTransferConfirmed: false,
  };
}

export class ConnectionAiPart extends FormPart<ConnectionAiPartState, IConnectionFormState> {
  constructor(
    formState: IFormState<IConnectionFormState>,
    private readonly connectionInfoAiResource: ConnectionInfoAiResource,
    private readonly optionsPart: ConnectionFormOptionsPart,
  ) {
    super(formState, defaultStateGetter());
  }

  override isOutdated(): boolean {
    if (!this.optionsPart.connectionKey) {
      return false;
    }

    return this.connectionInfoAiResource.isOutdated(this.optionsPart.connectionKey);
  }

  protected override async loader(): Promise<void> {
    if (!this.optionsPart.connectionKey) {
      this.setInitialState(defaultStateGetter());
      return;
    }

    const settings = await this.connectionInfoAiResource.load(this.optionsPart.connectionKey);

    this.setInitialState({
      metaTransferConfirmed: settings.metaTransferConfirmed,
    });
  }

  protected override async saveChanges(
    data: IFormState<IConnectionFormState>,
    contexts: IExecutionContextProvider<IFormState<IConnectionFormState>>,
  ): Promise<void> {
    const submitInfo = contexts.getContext(formSubmitContext);
    if (submitInfo.type === 'test' || !this.optionsPart.connectionKey) {
      return;
    }

    await this.connectionInfoAiResource.save(this.optionsPart.connectionKey, {
      metaTransferConfirmed: this.state.metaTransferConfirmed ?? false,
    });
  }
}
