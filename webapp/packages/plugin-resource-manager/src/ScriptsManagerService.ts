/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { NavTreeResource } from '@cloudbeaver/core-app';
import { injectable } from '@cloudbeaver/core-di';

import { ResourceManagerService, ROOT_NODE_PATH } from './ResourceManagerService';

const SCRIPTS_FOLDER = 'cbadmin';

@injectable()
export class ScriptsManagerService {
  constructor(
    private readonly resourceManagerService: ResourceManagerService,
    private readonly navTreeResource: NavTreeResource
  ) { }

  async saveScript(name: string, script: string) {
    await this.resourceManagerService.createResource(SCRIPTS_FOLDER, name, false);
    await this.resourceManagerService.writeResource(script, SCRIPTS_FOLDER, name);
    await this.updateScriptNodes();
  }

  private async updateScriptNodes() {
    await this.navTreeResource.refreshTree(ROOT_NODE_PATH);
  }
}