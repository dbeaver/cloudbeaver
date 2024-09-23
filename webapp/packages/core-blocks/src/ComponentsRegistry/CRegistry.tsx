/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import React, { memo, useContext } from 'react';

import { ComponentsRegistryContext } from './ComponentsRegistryContext.js';
import { type CRegistryList } from './CRegistryList.js';

export interface CRegistryProps extends React.PropsWithChildren {
  registry: CRegistryList;
}

/**
 * experimental, can be changed
 */
export const CRegistry = memo<CRegistryProps>(function CRegistry({ registry, children }) {
  const parent = useContext(ComponentsRegistryContext);
  const context = new Map(parent);

  for (const [component, validators] of registry) {
    context.set(component, [...(context.get(component) || []), validators]);
  }

  return <ComponentsRegistryContext.Provider value={context}>{children}</ComponentsRegistryContext.Provider>;
});
