/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { makeObservable, observable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { OptionsPanelService } from '@cloudbeaver/core-ui';

import { PublicConnectionForm } from './PublicConnectionForm';

const formGetter = () => PublicConnectionForm;

@injectable()
export class PublicConnectionFormService {
  connectionId: string | null;

  constructor(
    private readonly optionsPanelService: OptionsPanelService
  ) {
    makeObservable(this, {
      connectionId: observable,
    });

    this.connectionId = null;
  }

  async open(connectionId: string): Promise<void> {
    this.connectionId = connectionId;
    await this.optionsPanelService.open(formGetter);
  }

  async close(): Promise<void> {
    this.connectionId = null;
    await this.optionsPanelService.close();
  }
}
