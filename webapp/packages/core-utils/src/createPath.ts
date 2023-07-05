/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export function createPath(...names: Array<string | undefined>): string {
  return names
    .filter(Boolean)
    .map((name, i) => (i === 0 ? name!.replace(/\/$/, '') : name!.replace(/^\/|\/$/g, '')))
    .join('/');
}
