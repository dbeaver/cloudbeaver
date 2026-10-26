/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IScopeFilterResult } from './IScopeFilterResult.js';

export function getScopeFilterResult(
  query: string,
  items: { uri: string; name: string }[],
  loadedIds: Iterable<string>,
  getParents: (id: string) => string[],
): IScopeFilterResult {
  const matches = new Set<string>();
  const expanded = new Set<string>();
  const search = query.toLowerCase();
  for (const item of items) {
    if (!item.name.toLowerCase().includes(search)) {
      continue;
    }
    matches.add(item.uri);
    for (const parent of getParents(item.uri)) {
      expanded.add(parent);
    }
  }
  const visible = new Set([...matches, ...expanded]);
  for (const id of loadedIds) {
    if (getParents(id).some(parent => matches.has(parent))) {
      visible.add(id);
    }
  }
  return { visible, expanded };
}
