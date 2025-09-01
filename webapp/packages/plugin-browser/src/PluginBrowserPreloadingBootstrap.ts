/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { ServiceWorkerService } from '@cloudbeaver/core-browser';
import { displayUpdateStatus, injectable, IPreloadService } from '@cloudbeaver/core-di';

@injectable(() => [ServiceWorkerService])
export class PluginBrowserPreloadingBootstrap implements IPreloadService {
  constructor(private readonly serviceWorkerService: ServiceWorkerService) {}
  register(): void {
    this.serviceWorkerService.onUpdate.addHandler(({ type, progress }) => {
      progress = progress || 0;

      switch (type) {
        case 'installing':
          displayUpdateStatus(progress, 'Installing...');
          break;
        case 'updating':
          displayUpdateStatus(progress, 'Updating...');
          break;
        case 'finished':
          break;
      }
    });
  }
}
