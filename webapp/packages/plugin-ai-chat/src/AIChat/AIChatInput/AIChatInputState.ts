/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, makeObservable, observable } from 'mobx';

import { AIChatAttachmentsState } from '../../AIChatAttachments/AIChatAttachmentsState.js';

export class AIChatInputState {
  prompt = '';
  readonly attachments = new AIChatAttachmentsState();

  constructor(public conversationId: string | null) {
    makeObservable(this, {
      prompt: observable.ref,
      setPrompt: action,
    });
  }

  setPrompt(prompt: string): void {
    this.prompt = prompt;
  }
}
