/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { TabsContainer } from '@cloudbeaver/core-blocks';
import { injectable } from '@cloudbeaver/core-di';

import type { ConnectionFormController } from './ConnectionFormController';
import type { IConnectionFormModel } from './IConnectionFormModel';

export interface IConnectionFormProps {
  model: IConnectionFormModel;
  controller: ConnectionFormController;
}

@injectable()
export class ConnectionFormService {
  readonly tabsContainer: TabsContainer<IConnectionFormProps>;

  constructor() {
    this.tabsContainer = new TabsContainer();
  }
}
