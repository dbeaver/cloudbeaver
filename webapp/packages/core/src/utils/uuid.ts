/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { V4Options } from 'uuid/interfaces';
import uuidv4 from 'uuid/v4';

export function uuid(options?: V4Options): string {
  return uuidv4(options);
}
