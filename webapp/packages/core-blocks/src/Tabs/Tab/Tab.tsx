/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useMemo } from 'react';
import { Tab as BaseTab } from 'reakit/Tab';
import styled from 'reshadow';

import { useStyles } from '@cloudbeaver/core-theming';

import { Icon } from '../../Icons';
import { TabContext } from '../TabContext';
import { TabProps } from './TabProps';
import { useTab } from './useTab';

export const Tab: React.FC<TabProps> = function Tab({
  tabId,
  disabled,
  className,
  children,
  style,
  onOpen,
  onClose,
}) {
  const tabContext = useMemo(() => ({ tabId }), [tabId]);
  const { state, handleClose, handleOpen } = useTab(tabId, onOpen, onClose);

  return styled(useStyles(style))(
    <TabContext.Provider value={tabContext}>
      <tab-outer as='div'>
        <tab-inner as='div'>
          <BaseTab
            {...state.state}
            type="button"
            id={tabId}
            className={className}
            disabled={disabled}
            onClick={handleOpen}
          >
            <tab-container as='div'>
              {children}
              {onClose && (
                <tab-action as="div" onClick={handleClose}>
                  <Icon name="cross-bold" viewBox="0 0 7 8" />
                </tab-action>
              )}
            </tab-container>
          </BaseTab>
        </tab-inner>
      </tab-outer>
    </TabContext.Provider>
  );
};
