/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '../../injectable';

@injectable()
export class TestService {
  sum(a:number, b:number): number {
    return a + b;
  }
}