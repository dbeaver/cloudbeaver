/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
/// <reference types="vite/client" />
/// <reference lib="WebWorker" />
import { Workbox, type WorkboxLifecycleEvent, type WorkboxMessageEvent } from 'workbox-window';

import { Disposable, injectable } from '@cloudbeaver/core-di';
import { Executor, type IExecutor } from '@cloudbeaver/core-executor';
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
    this.handleMessage = this.handleMessage.bind(this);
    this.handleControlling = this.handleControlling.bind(this);
  }

  async register(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    try {
      if (import.meta.env.DEV) {
        const registration = await navigator.serviceWorker.getRegistration(this.workerURL);
        registration?.unregister();
      } else {
        this.workbox = new Workbox(this.workerURL);
        this.registration = (await this.workbox.register()) || null;
        // should be after registration
        this.registerEventListeners();

        if (this.registration?.active) {
          this.isUpdating = true;
        }
      }
    } catch (exception: any) {
      console.error(exception);
    }
  }

  async load(): Promise<void> {
    try {
      if (this.registration?.installing || this.registration?.waiting) {
        this.onUpdate.execute({
          type: this.isUpdating ? 'updating' : 'installing',
        });
      }

      await this.workbox?.update();

      if (this.registration?.active) {
        // wait for update only for active service worker
        if (this.registration.installing || this.registration.waiting) {
          // handled by refresh at 'controlling' event
          await new Promise(() => {});
        }
      }

      this.updateIntervalId = setInterval(() => this.workbox?.update(), 1000 * 60 * 60 * 24);
    } catch (exception: any) {
      console.error(exception);
    }
  }

  override dispose(): void {
    if (this.updateIntervalId) {
      clearInterval(this.updateIntervalId);
    }

    this.workbox?.removeEventListener('message', this.handleMessage);
    this.workbox?.removeEventListener('controlling', this.handleControlling);
  }

  private registerEventListeners(): void {
    this.workbox?.addEventListener('message', this.handleMessage);
    this.workbox?.addEventListener('controlling', this.handleControlling);
  }

  private handleMessage({ data }: WorkboxMessageEvent) {
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
  }

  private async handleControlling(event: WorkboxLifecycleEvent) {
    this.isUpdating = false;
    await this.onUpdate.execute({
      type: 'finished',
    });

    if (!event.isUpdate) {
      return;
    }

    window.location.reload();
  }
}
