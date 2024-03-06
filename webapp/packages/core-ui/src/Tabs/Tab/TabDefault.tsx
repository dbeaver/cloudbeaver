/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useContext, useMemo } from 'react';

import { Translate } from '@cloudbeaver/core-blocks';
import type { ComponentStyle } from '@cloudbeaver/core-theming';

import { TabContext } from '../TabContext';
import type { ITabData } from '../TabsContainer/ITabsContainer';
import { TabsContext } from '../TabsContext';
import { TabIcon } from './TabIcon';
import { TabNew } from './TabNew';
import type { TabProps } from './TabProps';
import { TabTitle } from './TabTitle';

interface Props<T = Record<string, any>> {
  tabId: string;
  icon?: string;
  name?: string;
  component?: React.FC<TabProps & T>;
  className?: string;
  style?: ComponentStyle;
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
  style, // TODO remove it
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
        <TabComponent
          tabId={tabId}
          className={className}
          {...(rest as unknown as T)}
          style={style}
          selected={selected}
          disabled={disabled}
          onOpen={onOpen}
          onClose={onClose}
        />
      </TabContext.Provider>
    );
  }

  return (
    <TabNew tabId={tabId} className={className} style={style} selected={selected} disabled={disabled} onOpen={onOpen} onClose={onClose}>
      {icon && <TabIcon icon={icon} />}
      {name && (
        <TabTitle>
          <Translate token={name} />
        </TabTitle>
      )}
    </TabNew>
  );
}
