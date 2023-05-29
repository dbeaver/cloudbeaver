/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { GlobalConstants } from '@cloudbeaver/core-utils';

@injectable()
export class EnvironmentService {
  readonly gqlEndpoint = GlobalConstants.absoluteServiceHTTPUrl('gql');
  readonly wsEndpoint = GlobalConstants.absoluteServiceWSUrl('ws');
}
