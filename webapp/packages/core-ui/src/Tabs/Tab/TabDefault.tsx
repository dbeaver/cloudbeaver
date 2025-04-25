/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Suspense, useContext, useMemo } from 'react';

import { Translate } from '@cloudbeaver/core-blocks';

import { TabContext } from '../TabContext.js';
import type { ITabData } from '../TabsContainer/ITabsContainer.js';
import { TabsContext } from '../TabsContext.js';
import { Tab } from './Tab.js';
import { TabIcon } from './TabIcon.js';
import type { TabProps } from './TabProps.js';
import { TabTitle } from './TabTitle.js';

interface Props<T = Record<string, any>> {
  tabId: string;
  icon?: string;
  name?: string;
  component?: React.FC<TabProps & T>;
  className?: string;
  disabled?: boolean;
  onOpen?: (tab: ITabData<any>) => void;
  onClose?: (tab: ITabData<any>) => void;
}

export function TabDefault<T = Record<string, any>>({
  tabId,
  icon,
  name,
  component,
  className,
  disabled,
  onOpen,
  onClose,
  ...rest
}: Props<T> & T): React.ReactElement | null {
  const state = useContext(TabsContext);
  const tabContext = useMemo(() => ({ tabId }), [tabId]);
  const selected = state?.state.selectedId === tabId;

  if (component) {
    const TabComponent = component;
    return (
      <TabContext.Provider value={tabContext}>
        <Suspense fallback={null}>
          {/* TODO: do we want to fallback to default tab with provided name and icon? */}
          <TabComponent
            tabId={tabId}
            className={className}
            {...(rest as unknown as T)}
            selected={selected}
            disabled={disabled}
            onOpen={onOpen}
            onClose={onClose}
          />
        </Suspense>
      </TabContext.Provider>
    );
  }

  return (
    <Tab tabId={tabId} className={className} selected={selected} disabled={disabled} onOpen={onOpen} onClose={onClose}>
      {icon && <TabIcon icon={icon} />}
      {name && (
        <TabTitle>
          <Translate token={name} />
        </TabTitle>
      )}
    </Tab>
  );
}
