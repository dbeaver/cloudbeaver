/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, observable } from 'mobx';

import { useObjectRef, useObservableRef } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { EObjectFeature, NavNodeInfoResource } from '@cloudbeaver/core-navigation-tree';
import { NavigationTreeService } from '@cloudbeaver/plugin-navigation-tree';

import { isScopeLeaf } from './isScopeLeaf.js';
import { isScopeObject } from './isScopeObject.js';
import { getScopeFilterResult } from './getScopeFilterResult.js';
import type { IScopeFilterResult } from './IScopeFilterResult.js';

interface ScopeFilter {
  query: string;
  containers: boolean;
  objects: boolean;
  readonly result: IScopeFilterResult | null;
}

export function useScopeFilter(rootId: string, isAllowed: (id: string) => boolean): ScopeFilter {
  const options = useObjectRef({ rootId, isAllowed });
  const navNodeInfoResource = useService(NavNodeInfoResource);
  const navigationTreeService = useService(NavigationTreeService);

  return useObservableRef<ScopeFilter>(
    () => ({
      query: '',
      containers: true,
      objects: true,
      get result(): ScopeFilter['result'] {
        if (!this.query.trim()) {
          return null;
        }
        const items: { uri: string; name: string }[] = [];
        const pending = [options.rootId];
        const visited = new Set<string>();
        while (pending.length) {
          const id = pending.pop()!;
          if (visited.has(id) || !options.isAllowed(id)) {
            continue;
          }
          visited.add(id);
          const node = navNodeInfoResource.get(id);
          if (!node) {
            continue;
          }
          const container = node.objectFeatures.some(feature => feature === EObjectFeature.catalog || feature === EObjectFeature.schema);
          if (id !== options.rootId && isScopeObject(node) && (container ? this.containers : this.objects)) {
            items.push({ uri: id, name: node.name || node.uri });
          }
          if (!isScopeLeaf(node)) {
            pending.push(...(navigationTreeService.getChildren(id) ?? []));
          }
        }

        return getScopeFilterResult(this.query.trim(), items, visited, id => navNodeInfoResource.getParents(id));
      },
    }),
    { query: observable.ref, containers: observable.ref, objects: observable.ref, result: computed },
    false,
  );
}
