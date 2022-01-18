/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { parseJSONFlat } from '@cloudbeaver/core-utils';

import { ServerConfigResource } from './ServerConfigResource';
import { ServerSettingsService } from './ServerSettingsService';
import { SessionService } from './SessionService';

@injectable()
export class ServerService {
  readonly settings: ServerSettingsService;

  private lastConfig: any = null;
  constructor(
    readonly config: ServerConfigResource,
    private readonly sessionService: SessionService
  ) {
    this.settings =  new ServerSettingsService(this.sessionService.settings);
    this.config.onDataUpdate.addHandler(this.refreshConfigAsync.bind(this));
  }

  private refreshConfigAsync() {
    if (!this.config.data) {
      return;
    }

    if (this.config.data.productConfiguration !== this.lastConfig) {
      this.lastConfig = this.config.data.productConfiguration;
      this.settings.clear();
      parseJSONFlat(
        this.config.data.productConfiguration,
        this.settings.setSelfValue.bind(this.settings)
      );
    }
  }
}
