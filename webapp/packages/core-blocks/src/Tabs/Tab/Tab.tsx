/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useContext, useCallback, PropsWithChildren } from 'react';
import { Tab as BaseTab } from 'reakit/Tab';
import styled from 'reshadow';

import { DynamicStyle, useStyles } from '@cloudbeaver/core-theming';

import { Icon } from '../../Icons';
import { TabsContext } from '../TabsContext';

export type TabProps = PropsWithChildren<{
  tabId: string;
  disabled?: boolean;
  className?: string;
  style?: DynamicStyle[] | DynamicStyle;
  onOpen?: (tabId: string) => void;
  onClose?: (tabId: string) => void;
}>

export function Tab({
  tabId,
  disabled,
  className,
  children,
  style,
  onOpen,
  onClose,
}: TabProps) {
  const state = useContext(TabsContext);
  if (!state) {
    throw new Error('TabsContext not provided');
  }

  const handleOpen = useCallback((e: React.MouseEvent<any>) => {
    e.preventDefault();
    state.select(tabId);
    if (onOpen) {
      onOpen(tabId);
    }
  }, [state, onOpen, tabId]);

  const handleClose = useCallback((e: React.MouseEvent<any>) => {
    e.preventDefault();
    e.stopPropagation(); // it's here because close triggers handleOpen too
    if (onClose) {
      onClose(tabId);
    }
  }, [onClose, tabId]);

  return styled(useStyles(style))(
    <tab-outer as='div'>
      <tab-inner as='div'>
        <BaseTab
          {...state.state}
          id={tabId}
          className={className}
          onClick={handleOpen}
          disabled={disabled}
        >
          <tab-container as='div'>
            {children}
            {onClose && (
              <tab-action as="div" onClick={handleClose}>
                <Icon name="cross-bold" viewBox="0 0 7 8"/>
              </tab-action>
            )}
          </tab-container>
        </BaseTab>
      </tab-inner>
    </tab-outer>
  );
}
