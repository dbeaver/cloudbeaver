/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed } from 'mobx';

import { useObservableRef, useResource } from '@cloudbeaver/core-blocks';
import { NavTreeResource } from '@cloudbeaver/core-navigation-tree';
import type { ILoadableState } from '@cloudbeaver/core-utils';

interface Result {
  readonly root: string;
  state: ILoadableState;
}

export function useTreeRoot(parent: string): Result {
  const navTreeResource = useResource(useTreeRoot, NavTreeResource, parent);

  const result = useObservableRef(() => ({
    get root() {
      if (navTreeResource.data?.length === 1) {
        return navTreeResource.data[0];
      }

      return this.parent;
    },
  }), { root: computed }, { parent });

  return {
    root: result.root,
    state: navTreeResource,
  };
}