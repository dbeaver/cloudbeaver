/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { importLazyComponent } from '@cloudbeaver/core-blocks';

import { ConnectionPreferencesFormService } from '../ConnectionPreferencesFormService.js';

const ConnectionPreferencesFormInfo = importLazyComponent(() =>
  import('./ConnectionPreferencesFormInfo.js').then(m => m.ConnectionPreferencesFormInfo),
);

@injectable(() => [ConnectionPreferencesFormService])
export class ConnectionPreferencesInfoTabService extends Bootstrap {
  constructor(private readonly connectionFormService: ConnectionPreferencesFormService) {
    super();
  }

  override register(): void {
    this.connectionFormService.parts.add({
      key: 'preferences-info',
      name: 'Info',
      order: 1,
      panel: () => ConnectionPreferencesFormInfo,
    });
  }
}
