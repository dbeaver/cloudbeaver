/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { pathJoin } from './pathJoin';

declare const _VERSION_: string | undefined;
declare const _DEV_: boolean | undefined;
declare const _ROOT_URI_: string | undefined;

export const GlobalConstants = {
  get dev(): boolean {
    return _DEV_ || false;
  },

  get version(): string | undefined {
    return _VERSION_;
  },

  get protocol(): 'http:' | 'https:' {
    return window.location.protocol as 'http:' | 'https:';
  },

  get wsProtocol(): 'ws:' | 'wss:' {
    return this.protocol === 'https:' ? 'wss:' : 'ws:';
  },

  get host(): string {
    return window.location.host;
  },

  get rootURI(): string {
    const defaultURI = '/';

    if (_ROOT_URI_ === '{ROOT_URI}') {
      return defaultURI;
    }
    return pathJoin(_ROOT_URI_ ?? defaultURI, '/');
  },

  get serviceURI(): string {
    return pathJoin(this.rootURI, 'api');
  },

  absoluteRootUrl(...parts: string[]): string {
    return pathJoin(this.rootURI, ...parts);
  },

  absoluteServiceUrl(...parts: string[]): string {
    return pathJoin(this.serviceURI, ...parts);
  },

  hostServiceUrl(...parts: string[]): string {
    return pathJoin(this.host, this.absoluteServiceUrl(...parts));
  },

  absoluteUrl(...parts: string[]): string {
    if (parts[0].startsWith('platform:')) {
      return this.absoluteServiceUrl('images', ...parts);
    }

    return this.absoluteRootUrl(...parts);
  },
};
