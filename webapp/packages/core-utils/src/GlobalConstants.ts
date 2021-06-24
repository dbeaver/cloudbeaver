/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import path from 'path';

declare const _VERSION_: string | undefined;
declare const _ROOT_URI_: string | undefined;

export const GlobalConstants = {
  get version(): string | undefined {
    return _VERSION_;
  },

  get rootURI(): string {
    const defaultURI = '/';

    if (_ROOT_URI_ === '{ROOT_URI}') {
      return defaultURI;
    }
    return _ROOT_URI_ ?? defaultURI;
  },

  get serviceURI(): string {
    return path.join(this.rootURI, 'api');
  },
};
