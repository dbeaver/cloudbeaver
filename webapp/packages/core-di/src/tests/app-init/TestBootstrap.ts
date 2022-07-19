/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap } from '../../Bootstrap';
import { injectable } from '../../injectable';
import { TestService } from './TestService';

@injectable()
export class TestBootstrap extends Bootstrap {
  loaded: boolean;
  registered: boolean;
  sum: number;

  constructor(
    readonly testService: TestService
  ) {
    super();
    this.loaded = false;
    this.registered = false;
    this.sum = 0;
  }

  register(): void | Promise<void> {
    this.registered = true;
  }

  async load(): Promise<void> {
    await new Promise(resolve => {
      setTimeout(() => {
        this.sum = this.testService.sum(1, 2);
        this.loaded = true;
        resolve(undefined);
      }, 5);
    });
  }

}