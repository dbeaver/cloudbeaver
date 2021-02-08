/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { TabsContainer } from '@cloudbeaver/core-blocks';
import { injectable } from '@cloudbeaver/core-di';
import type { ConnectionConfig, ConnectionInfo } from '@cloudbeaver/core-sdk';

export interface IFormPartState {
  key: string;
  data: any;
}

export interface IConnectionForm {
  onSubmit: () => void;
  // JDBC: boolean; // connection specific, maybe should be in another place
  originLocal: boolean; // connection specific, maybe should be in another place
  disabled: boolean;
  loading: boolean;
}

export interface IConnectionFormData {
  config: ConnectionConfig;
  info?: ConnectionInfo;
  partsState?: IFormPartState[];
  availableDrivers?: string[];
}

export interface IConnectionFormOptions {
  mode: 'edit' | 'create';
  type: 'admin' | 'public';
}

export interface IConnectionFormProps {
  data: IConnectionFormData;
  options: IConnectionFormOptions;
  form: IConnectionForm;
}

export interface IConnectionFormPartOptions {
  beforeSubmit?: () => void;
  afterSubmit?: () => void;
}

@injectable()
export class ConnectionFormService {
  readonly tabsContainer: TabsContainer<IConnectionFormProps, IConnectionFormPartOptions>;

  constructor() {
    this.tabsContainer = new TabsContainer();
  }
}
