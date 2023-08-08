/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { ConnectionInfoResource } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';

import { CreateConnectionService } from '../../CreateConnectionService';

@injectable()
export class ConnectionManualService {
  get disabled(): boolean {
    return this.createConnectionService.disabled;
  }

  set disabled(value: boolean) {
    this.createConnectionService.disabled = value;
  }

  constructor(private readonly connectionInfoResource: ConnectionInfoResource, private readonly createConnectionService: CreateConnectionService) {
    this.select = this.select.bind(this);
  }

  select(projectId: string, driverId: string): void {
    this.createConnectionService.setConnectionTemplate(
      projectId,
      {
        ...this.connectionInfoResource.getEmptyConfig(),
        template: true,
        driverId,
      },
      [driverId],
    );
  }
}
