/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable, Bootstrap } from '@cloudbeaver/core-di';
import { AdministrationItemService } from '@cloudbeaver/plugin-administration';

@injectable()
export class AuthAdministrationService extends Bootstrap {
  constructor(
    private administrationItemService: AdministrationItemService
  ) {
    super();
  }

  register() {
  }
  load(): void | Promise<void> {
  }
}
