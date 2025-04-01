/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
const MAX_HOST_LENGTH = 20;

interface IConnectionNameOptions {
  driverName: string;
  host?: string;
  port?: string;
  defaultPort?: string;
}

export function getConnectionName({ driverName, host, port, defaultPort }: IConnectionNameOptions): string {
  let name = driverName;

  if (host) {
    name += '@' + host.slice(0, MAX_HOST_LENGTH);
    if (port && port !== defaultPort) {
      name += ':' + port;
    }
  }

  return name;
}
