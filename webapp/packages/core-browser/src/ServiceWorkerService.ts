/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
/// <reference lib="WebWorker" />
import { Workbox } from 'workbox-window';

import { Disposable, injectable } from '@cloudbeaver/core-di';
import { Executor, IExecutor } from '@cloudbeaver/core-executor';
import { GlobalConstants } from '@cloudbeaver/core-utils';

@injectable()
export class ServiceWorkerService extends Disposable {
  readonly onUpdate: IExecutor<number>;

  private readonly workerURL: string;
  private workbox: Workbox | null;
  private updateIntervalId: ReturnType<typeof setInterval> | null;

  constructor() {
    super();
    this.onUpdate = new Executor();
    this.workerURL = GlobalConstants.absoluteRootUrl('service-worker.js');
    this.workbox = null;
    this.updateIntervalId = null;
  }

  async register(): Promise<void> {
    try {
      if (!('serviceWorker' in navigator)) {
        return;
      }
      if (process.env.NODE_ENV === 'development') {
        const registration = await navigator.serviceWorker.getRegistration(this.workerURL);
        registration?.unregister();
      } else {
        this.workbox = new Workbox(this.workerURL);
        this.registerRefreshAfterUpdate();

        this.workbox.register().then(sw => sw?.update());
      }
    } catch (e) {
      console.log(e);
    }
  }

  async load(): Promise<void> {
    this.updateIntervalId = setInterval(() => this.workbox?.update(), 1000 * 60 * 60 * 24);
  }

  dispose(): void {
    if (this.updateIntervalId) {
      clearInterval(this.updateIntervalId);
    }
  }

  private registerRefreshAfterUpdate(): void {
    if (!this.workbox) {
      return;
    }

    this.workbox.addEventListener('message', ({ data }) => {
      switch (data.type) {
        case 'update-progress':
          {
            const progress = Math.floor(Math.min(1, Math.max(0, data.progress)) * 100) / 100;
            this.onUpdate.execute(progress);
            // displayUpdateStatus(progress); // this can be enabled to display splash screen with updating state
          }
          break;
      }
    });

    this.workbox.addEventListener('controlling', async event => {
      if (!event.isUpdate) {
        return;
      }

      window.location.reload();
    });
  }
}
