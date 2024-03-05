/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export function errorOf<T extends abstract new (...args: any) => Error>(error: any, constructor: T): InstanceType<T> | undefined {
  if (error instanceof constructor) {
    return error as InstanceType<T>;
  }

  while (error) {
    if (error instanceof constructor) {
      return error as InstanceType<T>;
    }
    if (error instanceof Error) {
      error = error.cause;
    } else {
      return undefined;
    }
  }
  return undefined;
}
