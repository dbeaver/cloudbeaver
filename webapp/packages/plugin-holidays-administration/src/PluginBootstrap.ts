/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { AdministrationTopAppBarService } from '@cloudbeaver/plugin-administration';
import { HolidayActionButtonLazy } from '@cloudbeaver/plugin-holidays';

@injectable()
export class HolidayAdministrationBootstrap extends Bootstrap {
  constructor(private readonly administrationTopAppBarService: AdministrationTopAppBarService) {
    super();
  }

  override register() {
    this.administrationTopAppBarService.placeholder.add(HolidayActionButtonLazy, 4);
  }
}
