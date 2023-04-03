/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { AdministrationScreenService } from '@cloudbeaver/core-administration';
import { injectable } from '@cloudbeaver/core-di';

@injectable()
export class ConnectionsAdministrationNavService {
  constructor(
    private readonly administrationScreenService: AdministrationScreenService
  ) { }

  navToRoot() {
    this.administrationScreenService.navigateToItem('connections');
  }

  navToCreate(method: string) {
    this.administrationScreenService.navigateToItemSub('connections', 'create', method);
  }
}
