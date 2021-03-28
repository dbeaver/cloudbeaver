/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

declare const _VERSION_: string | undefined;

export const BuildVersion = {
  get version(): string | undefined {
    return _VERSION_;
  },
};
