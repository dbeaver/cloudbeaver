/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { type IWindowOptions, openCenteredPopup } from '@cloudbeaver/core-utils';

interface IWindowInfo {
  id: string;
  window: Window;
  promise: Promise<void>;
  onClose?: () => void;
}

@injectable()
export class WindowsService {
  private readonly windows: Map<string, IWindowInfo>;
  private trackWindowClose?: ReturnType<typeof setTimeout>;

  constructor() {
    this.windows = new Map();
  }

  open(id: string, options: IWindowOptions, onClose?: () => void): Window | null {
    const current = this.windows.get(id);

    if (current) {
      return current.window;
    }

    const window = openCenteredPopup(options);

    if (window) {
      let resolve: () => void;

      this.windows.set(id, {
        id,
        window,
        promise: new Promise(r => {
          resolve = r;
        }),
        onClose: () => {
          resolve();
          onClose?.();
        },
      });

      this.track();
      return window;
    }

    return null;
  }

  close(window: Window) {
    const current = Array.from(this.windows.values()).find(info => info.window === window);

    current?.window.close();
  }

  async waitWindowsClose(window: Window): Promise<void> {
    const current = Array.from(this.windows.values()).find(info => info.window === window);

    await current?.promise;
  }

  private track() {
    if (this.windows.size > 0) {
      if (!this.trackWindowClose) {
        this.trackWindowClose = setInterval(() => {
          const closedWindows = Array.from(this.windows.values()).filter(info => info.window.closed);

          for (const info of closedWindows) {
            info.onClose?.();
            this.windows.delete(info.id);
          }

          if (this.windows.size === 0) {
            clearInterval(this.trackWindowClose);
            this.trackWindowClose = undefined;
          }
        }, 100);
      }
    }
  }
}
