/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { GraphQLService, ObjectPropertyInfo } from '@cloudbeaver/core-sdk';

@injectable()
export class DriverPropertiesService {

  constructor(
    private graphQLService: GraphQLService,
  ) {
  }

  async loadDriverProperties(driverId: string): Promise<ObjectPropertyInfo[]> {
    const response = await this.graphQLService.sdk.driverProperties({
      driverId,
    });

    if (response.driver.length === 0) {
      throw new Error('Driver properties loading failed');
    }

    return response.driver[0].driverProperties! as ObjectPropertyInfo[];
  }
}
