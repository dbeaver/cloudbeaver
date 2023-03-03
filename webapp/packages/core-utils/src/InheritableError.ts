/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export class InheritableError extends Error {
  readonly inherit?: Error;
  constructor(
    inherit?: Error,
    message?: string,
  ) {
    super(message ?? (inherit instanceof Error ? inherit.message : undefined));
    this.name = 'Error';
    if (inherit instanceof Error) {
      this.inherit = inherit;
    }
  }

  isInherit<T extends abstract new (...args: any) => any>(
    constructor: T
  ): InstanceType<T> | undefined {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let inherit: Error | undefined = this;

    while (inherit) {
      if (inherit instanceof constructor) {
        return inherit as InstanceType<T>;
      }
      if (inherit instanceof InheritableError) {
        inherit = inherit.inherit;
      } else {
        return undefined;
      }
    }
    return undefined;
  }
}

export function errorOf<T extends abstract new (...args: any) => Error>(
  error: any,
  constructor: T
): InstanceType<T> | undefined {
  if (error instanceof constructor) {
    return error as InstanceType<T>;
  }

  if (error instanceof InheritableError) {
    return error.isInherit(constructor);
  }
  return undefined;
}
