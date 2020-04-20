/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { v4 as uuidv4 } from 'uuid';
import { V4Options } from 'uuid/interfaces';

export function uuid(options?: V4Options): string {
  return uuidv4(options);
}
