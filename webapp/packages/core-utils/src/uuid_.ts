/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { v4 as uuidv4 } from 'uuid';

export type OutputBuffer = ArrayLike<number>;
export type InputBuffer = ArrayLike<number>;

export interface RandomOptions {
  random?: InputBuffer;
}
export interface RngOptions {
  rng?: () => InputBuffer;
}

export interface V1BaseOptions {
  node?: InputBuffer;
  clockseq?: number;
  msecs?: number | Date;
  nsecs?: number;
}
export type V4Options = RandomOptions | RngOptions;

export function uuid(options?: V4Options): string {
  return uuidv4(options);
}
