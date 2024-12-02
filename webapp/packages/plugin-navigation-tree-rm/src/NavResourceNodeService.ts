/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { ConfirmationDialogDelete } from '@cloudbeaver/core-blocks';
import { injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { ResourceManagerResource } from '@cloudbeaver/core-resource-manager';
import { getPathName } from '@cloudbeaver/core-utils';

import { getResourceNodeId } from './NavNodes/getResourceNodeId.js';

@injectable()
export class NavResourceNodeService {
  constructor(
    private readonly resourceManagerResource: ResourceManagerResource,
    private readonly commonDialogService: CommonDialogService,
    private readonly localizationService: LocalizationService,
  ) {}

  async move(key: string, newKey: string): Promise<string> {
    await this.resourceManagerResource.move(key, newKey);

    return getResourceNodeId(newKey);
  }

  async delete(key: string) {
    const result = await this.commonDialogService.open(ConfirmationDialogDelete, {
      title: 'ui_data_delete_confirmation',
      message: this.localizationService.translate('plugin_navigation_tree_rm_delete_confirmation_message', undefined, { name: getPathName(key) }),
      confirmActionText: 'ui_delete',
    });

    if (result === DialogueStateResult.Rejected) {
      return;
    }

    await this.resourceManagerResource.deleteResource(key);
  }

  async read(key: string): Promise<string> {
    return await this.resourceManagerResource.readText(key);
  }

  async write(key: string, value: string) {
    await this.resourceManagerResource.writeText(key, value, true);
  }

  async setProperties(key: string, diff: Record<string, any>): Promise<Record<string, any>> {
    return await this.resourceManagerResource.setProperties(key, diff);
  }
}
