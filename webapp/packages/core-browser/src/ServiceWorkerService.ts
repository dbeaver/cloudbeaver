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

export interface IUpdateData {
  type: 'updating' | 'finished' | 'installing';
  progress?: number;
}

@injectable()
export class ServiceWorkerService extends Disposable {
  readonly onUpdate: IExecutor<IUpdateData>;

  private readonly workerURL: string;
  private workbox: Workbox | null;
  private updateIntervalId: ReturnType<typeof setInterval> | null;
  private isUpdating: boolean;
  private registration: ServiceWorkerRegistration | null;

  constructor() {
    super();
    this.onUpdate = new Executor();
    this.workerURL = GlobalConstants.absoluteRootUrl('service-worker.js');
    this.workbox = null;
    this.updateIntervalId = null;
    this.registration = null;
    this.isUpdating = false;
  }

  async register(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    this.workbox = new Workbox(this.workerURL);
    this.registration = (await this.workbox.register()) || null;
    this.registration?.addEventListener('updatefound', () => {});
    // should be after registration
    this.registerRefreshAfterUpdate();

    if (this.registration?.active) {
      this.isUpdating = true;
    }
  }

  async load(): Promise<void> {
    if (this.registration?.installing || this.registration?.waiting) {
      this.onUpdate.execute({
        type: this.isUpdating ? 'updating' : 'installing',
      });
    }

    if (this.registration?.active) {
      // wait for update only for active service worker
      await this.workbox?.update();

      if (this.registration.installing || this.registration.waiting) {
        // handled by refresh at 'controlling' event
        await new Promise(() => {});
      }
    }

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
        case 'mode':
          {
            this.onUpdate.execute({
              type: this.isUpdating || data.isUpdate ? 'updating' : 'installing',
            });
          }
          break;
        case 'progress':
          {
            const progress = Math.min(1, Math.max(0, data.progress));

            this.onUpdate.execute({
              type: this.isUpdating || data.isUpdate ? 'updating' : 'installing',
              progress,
            });
          }
          break;
      }
    });

    this.workbox.addEventListener('controlling', async event => {
      this.isUpdating = false;
      await this.onUpdate.execute({
        type: 'finished',
      });

      if (!event.isUpdate) {
        return;
      }

      window.location.reload();
    });
  }
}
