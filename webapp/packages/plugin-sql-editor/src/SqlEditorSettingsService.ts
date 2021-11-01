/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2019-2021 DBeaver Corp
 *
 * All Rights Reserved
 *
 * NOTICE:  All information contained herein is, and remains
 * the property of DBeaver Corp and its suppliers, if any.
 * The intellectual and technical concepts contained
 * herein are proprietary to DBeaver Corp and its suppliers
 * and may be covered by U.S. and Foreign Patents,
 * patents in process, and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from DBeaver Corp.
 */

import { injectable } from '@cloudbeaver/core-di';
import { PluginManagerService } from '@cloudbeaver/core-plugin';

const defaultSettings = {
  maxFileSize: 100, // kilobyte
};

@injectable()
export class SqlEditorSettingsService {
  readonly settings = this.pluginManagerService.getPluginSettings('core.app.sqlEditor', defaultSettings);

  constructor(private pluginManagerService: PluginManagerService) { }
}
