/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { v4 as uuidv4, type Version1Options, type Version4Options } from 'uuid';

export type V4Options = Version4Options;
export type V1Options = Version1Options;

export function uuid(options?: Version4Options): string {
  return uuidv4(options);
}
