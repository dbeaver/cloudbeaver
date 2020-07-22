/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { ServerService } from '@cloudbeaver/core-root';
import { parseJSONFlat } from '@cloudbeaver/core-utils';

import { ProductSettingsService } from './ProductSettingsService';

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
