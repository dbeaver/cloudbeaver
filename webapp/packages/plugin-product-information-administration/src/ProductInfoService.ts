/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { AdministrationItemContentProps } from '@cloudbeaver/core-administration';
import { Dependency, injectable } from '@cloudbeaver/core-di';
import { TabsContainer } from '@cloudbeaver/core-ui';

@injectable()
export class ProductInfoService extends Dependency {
  readonly tabsContainer: TabsContainer<AdministrationItemContentProps>;

  constructor() {
    super();
    this.tabsContainer = new TabsContainer('Product information administration settings');
  }
}
