/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { GlobalConstants } from '@cloudbeaver/core-utils';

@injectable()
export class ServiceWorkerBootstrap extends Bootstrap {
  register(): void | Promise<void> {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        const workerURL = GlobalConstants.absoluteRootUrl('/service-worker.js');

        if (process.env.NODE_ENV === 'development') {
          navigator.serviceWorker
            .getRegistration(workerURL)
            .then(registration => {
              const unregistered = registration?.unregister() ?? false;
              if (unregistered) {
                console.log('SW unregistered.');
              }
            })
            .catch();
        } else {
          navigator.serviceWorker
            .register(workerURL)
            .then(() => {
              console.log('SW registered.');
            }).catch(registrationError => {
              console.log('SW registration failed: ', registrationError);
            });
        }
      });
    }
  }
  load(): void | Promise<void> { }

}