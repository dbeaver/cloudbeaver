/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable as inversifyInjectable } from 'inversify';

export function injectable(): (target: any) => any {
  return inversifyInjectable();
}
