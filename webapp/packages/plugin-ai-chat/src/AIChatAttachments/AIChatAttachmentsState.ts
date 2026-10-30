/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, computed, makeObservable, observable } from 'mobx';

import type { IAIChatAttachment } from './AIChatAttachmentsService.js';

export class AIChatAttachmentsState {
  readonly attachments: IAIChatAttachment[] = [];
  dragOver = false;
  private loadingCount = 0;

  get loading(): boolean {
    return this.loadingCount > 0;
  }

  constructor() {
    makeObservable<this, 'loadingCount'>(this, {
      attachments: observable.shallow,
      dragOver: observable.ref,
      loadingCount: observable.ref,
      loading: computed,
      startLoading: action,
      finishLoading: action,
      setDragOver: action,
      add: action,
      remove: action,
    });
  }

  startLoading(): void {
    this.loadingCount++;
  }

  finishLoading(): void {
    this.loadingCount--;
  }

  setDragOver(dragOver: boolean): void {
    this.dragOver = dragOver;
  }

  add(attachment: IAIChatAttachment): void {
    this.attachments.push(attachment);
  }

  remove(attachment: IAIChatAttachment): void {
    const index = this.attachments.indexOf(attachment);

    if (index !== -1) {
      this.attachments.splice(index, 1);
    }
  }
}
