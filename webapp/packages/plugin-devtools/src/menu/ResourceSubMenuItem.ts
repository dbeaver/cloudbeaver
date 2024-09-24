/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IServiceConstructor } from '@cloudbeaver/core-di';
import { MenuSubMenuItem } from '@cloudbeaver/core-view';

import { MENU_RESOURCE } from './MENU_RESOURCE.js';

export class ResourceSubMenuItem extends MenuSubMenuItem {
  readonly resource: IServiceConstructor<any>;

  constructor(resource: IServiceConstructor<any>) {
    super({ menu: MENU_RESOURCE, label: resource.name });

    this.resource = resource;

    Object.assign(this, {
      id: resource.name,
    });
  }
}
