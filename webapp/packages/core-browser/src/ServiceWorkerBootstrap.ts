/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable, IPreloadService } from '@cloudbeaver/core-di';

import { ServiceWorkerService } from './ServiceWorkerService.js';

@injectable(() => [ServiceWorkerService])
export class ServiceWorkerBootstrap implements IPreloadService {
  constructor(private readonly serviceWorkerService: ServiceWorkerService) {}
  async register(): Promise<void> {
    await this.serviceWorkerService.register();
  }
  async load(): Promise<void> {
    await this.serviceWorkerService.load();
  }
}
