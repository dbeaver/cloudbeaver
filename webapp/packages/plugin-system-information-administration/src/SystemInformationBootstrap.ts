/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { injectable, Bootstrap } from '@cloudbeaver/core-di';
import { ProductInfoService } from '@cloudbeaver/plugin-product-information-administration';

const SystemInformation = importLazyComponent(() => import('./SystemInformation.js').then(m => m.SystemInformation));

@injectable()
export class SystemInformationBootstrap extends Bootstrap {
  constructor(private readonly productInfoService: ProductInfoService) {
    super();
  }

  override register(): void {
    this.productInfoService.addSubItem({
      key: 'system-information',
      name: 'plugin_system_information_administration_tab_title',
      panel: () => SystemInformation,
      order: 2,
    });
  }
}
