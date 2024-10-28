/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { UsersResource } from '@cloudbeaver/core-authentication';
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { injectable } from '@cloudbeaver/core-di';
import { BaseOptionsPanelService, OptionsPanelService } from '@cloudbeaver/core-ui';

const UsersTableOptionsPanel = importLazyComponent(() => import('./UsersTableOptionsPanel.js').then(m => m.UsersTableOptionsPanel));
const panelGetter = () => UsersTableOptionsPanel;

@injectable()
export class UsersTableOptionsPanelService extends BaseOptionsPanelService<string> {
  constructor(
    optionsPanelService: OptionsPanelService,
    private readonly usersResource: UsersResource,
  ) {
    super(optionsPanelService, panelGetter);

    this.usersResource.onItemDelete.addHandler(data => {
      if (data === this.itemId) {
        this.close();
      }
    });
  }
}
