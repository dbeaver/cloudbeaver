/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';

import { ClipboardService } from './ClipboardService';

@injectable()
export class ClipboardBootstrap extends Bootstrap {
  constructor(
    private clipboardService: ClipboardService,
  ) {
    super();
  }

  register(): void { }

  async load(): Promise<void> {
    if (!navigator.clipboard) {
      this.clipboardService.clipboardAvailable = false;
      return;
    }

    this.clipboardService.clipboardAvailable = true;

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const that = this;
    try {
      const clipboardPermission = await navigator.permissions.query({ name: 'clipboard-read' });
      this.clipboardService.state = clipboardPermission.state;

      // bad support, don't rely on this
      clipboardPermission.onchange = function () {
        that.clipboardService.state = this.state;
        if (this.state === 'denied' || this.state === 'prompt') {
          that.clipboardService.clipboardValue = null;
        }
      };
    } catch (exeption) {
      that.clipboardService.state = 'denied';
      that.clipboardService.clipboardValue = null;
      console.error(exeption);
    }
  }
}
