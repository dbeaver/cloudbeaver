/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
// @ts-nocheck
import pnp from 'pnpapi';

const roots = pnp.getDependencyTreeRoots();
const locations = new Map<string, string>(roots.map(root => [root.name, pnp.getPackageInformation(root).packageLocation]));

export function resolvePathWithPnpApi(name: string): string {
  return locations.get(name);
}