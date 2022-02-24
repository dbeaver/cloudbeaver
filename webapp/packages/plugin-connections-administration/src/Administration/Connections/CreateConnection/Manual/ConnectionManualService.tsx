/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';

import { ConnectionsResource } from '../../../ConnectionsResource';
import { CreateConnectionService } from '../../CreateConnectionService';

@injectable()
export class ConnectionManualService {
  get disabled(): boolean {
    return this.createConnectionService.disabled;
  }

  set disabled(value: boolean) {
    this.createConnectionService.disabled = value;
  }

  constructor(
    private readonly connectionsResource: ConnectionsResource,
    private createConnectionService: CreateConnectionService
  ) {
    this.select = this.select.bind(this);
  }

  select(driverId: string): void {
    this.createConnectionService.setConnectionTemplate(
      {
        ...this.connectionsResource.getEmptyConfig(),
        driverId,
      },
      [driverId]
    );
  }
}
