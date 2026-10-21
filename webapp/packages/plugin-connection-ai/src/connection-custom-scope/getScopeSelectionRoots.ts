/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export function getScopeSelectionRoots(selectedIds: Iterable<string>, getParents: (id: string) => string[]): string[] {
  const selected = new Set(selectedIds);
  return [...selected].filter(id => !getParents(id).some(parent => selected.has(parent)));
}
