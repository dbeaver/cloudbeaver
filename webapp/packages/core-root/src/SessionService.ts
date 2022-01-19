/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';

import { SessionResource } from './SessionResource';
import { SessionSettingsService } from './SessionSettingsService';

@injectable()
export class SessionService {
  readonly settings = new SessionSettingsService('session_settings');

  constructor(
    readonly session: SessionResource
  ) {
  }

  async update(): Promise<void> {
    await this.session.refresh();
  }
}
