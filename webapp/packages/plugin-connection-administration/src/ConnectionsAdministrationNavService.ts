/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { AdministrationScreenService } from '@cloudbeaver/core-administration';
import { injectable } from '@cloudbeaver/core-di';

import { ADMINISTRATION_CONNECTIONS_ITEM } from './ADMINISTRATION_CONNECTIONS_ITEM.js';

@injectable(() => [AdministrationScreenService])
export class ConnectionsAdministrationNavService {
  constructor(private readonly administrationScreenService: AdministrationScreenService) {}

  navToRoot(): void {
    this.administrationScreenService.navigateToItem(ADMINISTRATION_CONNECTIONS_ITEM);
  }

  navToSub(sub: string, param?: string): void {
    this.administrationScreenService.navigateToItemSub(ADMINISTRATION_CONNECTIONS_ITEM, sub, param);
  }
}
