/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useMemo } from 'react';
import { Tab as BaseTab } from 'reakit/Tab';
import styled from 'reshadow';

import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';

import { Icon } from '../../Icon';
import { TabContext } from '../TabContext';
import type { TabProps } from './TabProps';
import { useTab } from './useTab';

export const Tab: React.FC<TabProps> = observer(function Tab({
  tabId,
  title,
  disabled,
  className,
  children,
  style,
  onOpen,
  onClose,
}) {
  const translate = useTranslate();
  const tabContext = useMemo(() => ({ tabId }), [tabId]);
  const { state, getInfo, handleClose, handleOpen } = useTab(tabId, onOpen, onClose);
  const info = getInfo();

  return styled(useStyles(style))(
    <TabContext.Provider value={tabContext}>
      <tab-outer>
        <tab-inner>
          <BaseTab
            {...state.state}
            type="button"
            title={translate(title ?? info?.title)}
            id={tabId}
            className={className}
            disabled={disabled}
            onClick={handleOpen}
          >
            <tab-container>
              {children}
              {onClose && (
                <tab-action onClick={handleClose}>
                  <Icon name="cross-bold" viewBox="0 0 7 8" />
                </tab-action>
              )}
            </tab-container>
          </BaseTab>
        </tab-inner>
      </tab-outer>
    </TabContext.Provider>
  );
});
