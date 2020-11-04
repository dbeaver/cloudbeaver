/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { TabsContainer } from '@cloudbeaver/core-blocks';
import { injectable } from '@cloudbeaver/core-di';

import { ConnectionFormController } from './ConnectionFormController';
import { IConnectionFormModel } from './IConnectionFormModel';

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
