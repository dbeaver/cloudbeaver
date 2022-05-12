/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { Executor, IExecutor } from '@cloudbeaver/core-executor';

@injectable()
export class WindowEventsService extends Bootstrap {
  readonly onFocusChange: IExecutor<boolean>;

  constructor() {
    super();
    this.onFocusChange = new Executor();
  }

  register(): void {
    window.addEventListener('focus', () => this.onFocusChange.execute(true));
    window.addEventListener('blur', () => this.onFocusChange.execute(false));
  }

  load(): void | Promise<void> { }
}