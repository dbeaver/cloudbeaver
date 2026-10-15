/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
interface IConnectionNameOptions {
  driverName: string;
  host?: string;
  port?: string;
  defaultPort?: string;
}

export function getConnectionName({ driverName, host, port, defaultPort }: IConnectionNameOptions): string {
  let name = driverName;

  if (host) {
    name += '@' + host;
    if (port && port !== defaultPort) {
      name += ':' + port;
    }
  }

  return name;
}
