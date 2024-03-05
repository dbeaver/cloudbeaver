/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { PlaceholderContainer } from '@cloudbeaver/core-blocks';
import { injectable } from '@cloudbeaver/core-di';

@injectable()
export class AppScreenService {
  static screenName = 'app';
  readonly placeholder: PlaceholderContainer;
  readonly rightAreaTop: PlaceholderContainer;
  readonly rightAreaBottom: PlaceholderContainer;

  constructor() {
    this.placeholder = new PlaceholderContainer();
    this.rightAreaTop = new PlaceholderContainer();
    this.rightAreaBottom = new PlaceholderContainer();
  }
}
