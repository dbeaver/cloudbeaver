/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Workbox } from 'workbox-window';

import { injectable } from '@cloudbeaver/core-di';
import { Executor, ExecutorInterrupter, IExecutor } from '@cloudbeaver/core-executor';
import { GlobalConstants } from '@cloudbeaver/core-utils';

@injectable()
export class ServiceWorkerService {
  readonly onUpdate: IExecutor;

  private readonly workerURL: string;
  private readonly workbox: Workbox;

  constructor() {
    this.onUpdate = new Executor();
    this.workerURL = GlobalConstants.absoluteRootUrl('/service-worker.js');
    this.workbox = new Workbox(this.workerURL);
  }

  register(): void | Promise<void> {
    if ('serviceWorker' in navigator) {
      if (process.env.NODE_ENV === 'development') {
        navigator.serviceWorker
          .getRegistration(this.workerURL)
          .then(registration =>  registration?.unregister())
          .catch();
      } else {
        this.registerSkipWaitingPrompt();
        this.workbox.register();
      }
    }
  }

  async requestUpdate(): Promise<boolean> {
    const contexts = await this.onUpdate.execute();

    return !ExecutorInterrupter.isInterrupted(contexts);
  }


  private registerSkipWaitingPrompt(): void {
    this.workbox.addEventListener('controlling', async () => {
      const updateAccepted = await this.requestUpdate();

      if (updateAccepted) {
        window.location.reload();
      }
    });

    this.workbox.addEventListener('waiting', event => {
      this.workbox.messageSkipWaiting();
    });
  }
}