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

import { useStyles } from '@cloudbeaver/core-theming';

import { Icon } from '../../Icons';
import { TabsContext } from '../TabsContext';

type TabProps = PropsWithChildren<{
  tabId: string;
  className?: string;
  onOpen?: (tabId: string) => void;
  onClose?: (tabId: string) => void;
}>

export function Tab({
  tabId,
  onOpen,
  onClose,
  className,
  children,
}: TabProps) {
  const state = useContext(TabsContext);
  if (!state) {
    throw new Error('TabsContext not provided');
  }

  const handleOpen = useCallback((e: React.MouseEvent<any>) => {
    e.preventDefault();
    if (onOpen) {
      onOpen(tabId);
    }
  }, [onOpen]);

  const handleClose = useCallback((e: React.MouseEvent<any>) => {
    e.preventDefault();
    e.stopPropagation(); // it's here because close triggers handleOpen too
    if (onClose) {
      onClose(tabId);
    }
  }, [onClose]);

  return styled(useStyles())(
    <BaseTab
      {...state}
      stopId={tabId}
      className={className}
      onClick={handleOpen}
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
  );
}
