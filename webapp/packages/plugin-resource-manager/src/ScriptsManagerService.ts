/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { NavTreeResource } from '@cloudbeaver/core-app';
import { injectable } from '@cloudbeaver/core-di';
import { SqlEditorNavigatorService } from '@cloudbeaver/plugin-sql-editor-navigation-tab';

import { ResourceManagerService, ROOT_NODE_PATH } from './ResourceManagerService';

const SCRIPTS_FOLDER = 'cbadmin';
export const SCRIPTS_ROOT_PATH = `${ROOT_NODE_PATH}/${SCRIPTS_FOLDER}`;
const SCRIPT_EXTENSION = '.sql';

@injectable()
export class ScriptsManagerService {
  constructor(
    private readonly resourceManagerService: ResourceManagerService,
    private readonly navTreeResource: NavTreeResource,
    private readonly sqlEditorNavigatorService: SqlEditorNavigatorService
  ) { }

  isScript(nodeId: string) {
    return this.resourceManagerService.getResourceName(nodeId).includes(SCRIPT_EXTENSION);
  }

  getScriptName(nodeId: string) {
    return this.resourceManagerService.getResourceName(nodeId);
  }

  isScriptExists(nodeId: string) {
    const resource = this.navTreeResource.get(SCRIPTS_ROOT_PATH);
    return resource?.includes(nodeId);
  }

  async openScript(id: string) {
    const name = this.resourceManagerService.getResourceName(id) || 'Unknown script';
    const scriptValue = await this.readScript(id);

    await this.sqlEditorNavigatorService.openNewEditor({
      name,
      query: scriptValue,
      associatedScriptId: id,
    });
  }

  async saveScript(name: string, script: string) {
    name = name + SCRIPT_EXTENSION;
    await this.resourceManagerService.createResource(SCRIPTS_FOLDER, name, false);
    await this.resourceManagerService.writeResource(SCRIPTS_FOLDER, name, script);
    await this.updateScriptNodes();

    return this.getNodeIdFromScript(name);
  }

  async readScript(nodeId: string) {
    const name = this.resourceManagerService.getResourceName(nodeId);
    return await this.resourceManagerService.readResource(SCRIPTS_FOLDER, name);
  }

  async writeScript(nodeId: string, value: string) {
    const name = this.resourceManagerService.getResourceName(nodeId);

    if (!this.isScriptExists(nodeId)) {
      throw new Error(`Unable to find the script: "${name}".\nIt was probably renamed or deleted`);
    }

    await this.resourceManagerService.writeResource(SCRIPTS_FOLDER, name, value);
  }

  private getNodeIdFromScript(scriptName: string) {
    return `${SCRIPTS_ROOT_PATH}/${scriptName}`;
  }

  private async updateScriptNodes() {
    await this.navTreeResource.refreshTree(SCRIPTS_ROOT_PATH);
  }
}