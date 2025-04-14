/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap } from '../../Bootstrap.js';
import { injectable } from '../../injectable.js';
import { TestService } from './TestService.js';

@injectable()
export class TestBootstrap extends Bootstrap {
  loaded: boolean;
  registered: boolean;
  sum: number;

  constructor(readonly testService: TestService) {
    super();
    this.loaded = false;
    this.registered = false;
    this.sum = 0;
  }

  override register(): void {
    this.registered = true;
  }

  override async load(): Promise<void> {
    await new Promise(resolve => {
      this.sum = this.testService.sum(1, 2);
      this.loaded = true;
      resolve(undefined);
    });
  }
}
