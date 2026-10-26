/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { type PropsWithChildren, type ReactPortal, useContext } from 'react';
import { createPortal } from 'react-dom';

import { CRegistry, type CRegistryList } from '@cloudbeaver/core-blocks';
import { MenuBarItem } from '@cloudbeaver/core-ui';

import { UsersAdministrationHeaderActionsContext } from './UsersAdministrationHeaderActionsContext.js';
import { UsersAdministrationMenuButton } from './UsersTable/UsersAdministrationMenuButton.js';

const actionsRegistry: CRegistryList = [
  [MenuBarItem, [{ component: MenuBarItem, replacement: UsersAdministrationMenuButton, validator: () => true }]],
];

export function UsersAdministrationHeaderActions({ children }: PropsWithChildren): ReactPortal | null {
  const container = useContext(UsersAdministrationHeaderActionsContext);

  return container ? createPortal(<CRegistry registry={actionsRegistry}>{children}</CRegistry>, container) : null;
}
