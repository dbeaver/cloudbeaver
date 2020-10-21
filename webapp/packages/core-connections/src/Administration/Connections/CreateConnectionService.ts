/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, observable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';

export interface IConnectionCreateMethod {
  key: string;
  title: string;
  panel: () => React.FC;
  onOpen?: () => void;
}

@injectable()
export class CreateConnectionService {
  @observable.shallow
  readonly methods: Map<string, IConnectionCreateMethod>;

  @computed get methodList(): IConnectionCreateMethod[] {
    return Array.from(this.methods.values());
  }

  constructor() {
    this.methods = new Map();
  }

  addMethod(method: IConnectionCreateMethod): void {
    if (this.methods.has(method.key)) {
      throw new Error('Method with same key already exists');
    }

    this.methods.set(method.key, method);
  }
}
