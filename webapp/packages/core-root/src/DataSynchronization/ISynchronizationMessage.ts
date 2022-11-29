/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export type ISynchronizationMessageResolveCallback = (state: boolean) => void;

export interface ISynchronizationMessage {
  readonly id: string;
  readonly label: string;
  readonly message: string;
  readonly resolver: Promise<boolean>;
  resolve(state: boolean): void;
  readonly then: (handler: ISynchronizationMessageResolveCallback) => void;
}