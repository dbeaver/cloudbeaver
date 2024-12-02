/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { ServiceWorkerService } from '@cloudbeaver/core-browser';
import { Bootstrap, displayUpdateStatus, injectable } from '@cloudbeaver/core-di';

@injectable()
export class PluginBrowserPreloadingBootstrap extends Bootstrap {
  constructor(private readonly serviceWorkerService: ServiceWorkerService) {
    super();
  }
  override register(): void {
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
