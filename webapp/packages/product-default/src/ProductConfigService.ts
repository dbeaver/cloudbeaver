/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable, Bootstrap } from '@cloudbeaver/core-di';
import { ProductManagerService } from '@cloudbeaver/core-product';

import productConfig from './config.json5';

@injectable()
export class ProductConfigService extends Bootstrap {
  constructor(private productManager: ProductManagerService) {
    super();
  }

  register(): void | Promise<void> {
    this.productManager.setSettings(productConfig);
  }

  load(): void | Promise<void> { }
}
