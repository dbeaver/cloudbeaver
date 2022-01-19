/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { Executor, IExecutor } from '@cloudbeaver/core-executor';
import { RouterService } from '@cloudbeaver/core-routing';

@injectable()
export class NavigationService {
  readonly navigationTask: IExecutor<any>;

  constructor(
    routerService: RouterService
  ) {
    this.navigationTask = new Executor();
    routerService.transitionTask.before(this.navigationTask);
  }
}
