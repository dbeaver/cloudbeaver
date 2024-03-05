/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { parseJSONFlat } from '@cloudbeaver/core-utils';

import { ProductSettingsService } from './ProductSettingsService';

@injectable()
export class ProductManagerService {
  constructor(private readonly productSettingsService: ProductSettingsService) {}

  setSettings(object: any) {
    parseJSONFlat(object, this.productSettingsService.setValue.bind(this.productSettingsService), undefined);
  }
}
