/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@dbeaver/core/di';
import { ServerService } from '@dbeaver/core/root';
import { ProductSettingsService } from '@dbeaver/core/settings';
import { parseJSONFlat } from '@dbeaver/core/utils';


@injectable()
export class ProductManagerService {

  readonly settings = new ProductSettingsService(this.serverService.settings)

  constructor(private serverService: ServerService) { }

  setSettings(object: any) {

    parseJSONFlat(
      object,
      this.settings.setSelfValue.bind(this.settings),
      undefined
    );
  }
}
