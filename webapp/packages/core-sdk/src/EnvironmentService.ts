/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';

@injectable()
export class EnvironmentService {
  readonly gqlEndpoint = '/dbeaver/gql';
  readonly staticEndpoint = '/dbeaver';
}
