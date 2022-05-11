/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { makeObservable, observable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';

@injectable()
export class ResourceManagerService {
  enabled = false;

  constructor() {
    this.toggleEnabled = this.toggleEnabled.bind(this);

    makeObservable(this, {
      enabled: observable.ref,
    });
  }

  toggleEnabled() {
    this.enabled = !this.enabled;
  }
}