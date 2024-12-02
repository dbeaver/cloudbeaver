/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, injectable } from '@cloudbeaver/core-di';

import { ServiceWorkerService } from './ServiceWorkerService.js';

@injectable()
export class ServiceWorkerBootstrap extends Bootstrap {
  constructor(private readonly serviceWorkerService: ServiceWorkerService) {
    super();
  }
  override async register(): Promise<void> {
    await this.serviceWorkerService.register();
  }
  override async load(): Promise<void> {
    await this.serviceWorkerService.load();
  }
}
