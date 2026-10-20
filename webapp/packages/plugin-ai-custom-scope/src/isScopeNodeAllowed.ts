/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export function isScopeNodeAllowed(id: string, allowedIds: string[] | null | undefined, getParents: (id: string) => string[]): boolean {
  return allowedIds == null || allowedIds.some(allowed => allowed === id || getParents(id).includes(allowed) || getParents(allowed).includes(id));
}
