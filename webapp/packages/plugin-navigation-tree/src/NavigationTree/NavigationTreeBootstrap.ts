/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';

import  { ElementsTreeToolsMenuService } from './ElementsTree/ElementsTreeTools/ElementsTreeToolsMenuService';

@injectable()
export class NavigationTreeBootstrap extends Bootstrap {
  constructor(
    private readonly elementsTreeToolsMenuService: ElementsTreeToolsMenuService
  ) {
    super();
  }

  register(): void | Promise<void> {
    this.elementsTreeToolsMenuService.register();
  }

  async load(): Promise<void> { }
}