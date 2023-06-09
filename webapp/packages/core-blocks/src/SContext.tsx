/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import React, { createContext } from 'react';

import type { IStyleRegistry, Style } from '@cloudbeaver/core-theming';

type Registry = Map<Style, IStyleRegistry[]>;

export const SContextReact = createContext<Registry>(new Map());

type Props = {
  registry: [Style, IStyleRegistry][];
};

export const SContext: React.FC<React.PropsWithChildren<Props>> = function SContext({ registry, children }) {
  const context = React.useContext(SContextReact);
  const state = new Map(context.entries());

  for (const [style, styles] of registry) {
    state.set(style, [...(state.get(style) || []), styles]);
  }

  return <SContextReact.Provider value={state}>{children}</SContextReact.Provider>;
};
