/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { AdministrationScreenService } from '@cloudbeaver/core-administration';
import { injectable } from '@cloudbeaver/core-di';

import { ADMINISTRATION_AI_PAGE } from './ADMINISTRATION_AI_PAGE.js';

export enum EAIAdministrationSub {
  Settings = 'settings',
  Profiles = 'profiles',
  ToolsAndMcp = 'tools-and-mcp',
}

@injectable(() => [AdministrationScreenService])
export class AIAdministrationNavigationService {
  static ItemName = ADMINISTRATION_AI_PAGE;

  constructor(private readonly administrationScreenService: AdministrationScreenService) {}

  navToSub(sub: string): void {
    this.administrationScreenService.navigateToItemSub(AIAdministrationNavigationService.ItemName, sub);
  }
}
