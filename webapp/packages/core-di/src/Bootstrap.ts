/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Disposable } from './Disposable';
import { injectable } from './injectable';

@injectable()
export abstract class Bootstrap extends Disposable {
  register(): void | Promise<void> {}
  load(): void | Promise<void> {}
}
