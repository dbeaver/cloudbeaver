/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import type { TabsContainer } from '../Tabs/TabsContainer/TabsContainer.js';
import { useSidebarPanelActivation } from './useSidebarPanelActivation.js';

interface ISidebarPanelActivationProps {
  container: TabsContainer;
}

export const SidebarPanelActivation = observer<ISidebarPanelActivationProps>(function SidebarPanelActivation({ container }) {
  useSidebarPanelActivation(container);

  return null;
});
