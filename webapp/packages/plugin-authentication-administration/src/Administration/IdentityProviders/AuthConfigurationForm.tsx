/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import styled, { css } from 'reshadow';

import { Placeholder, useObjectRef, useExecutor, BASE_CONTAINERS_STYLES, IconOrImage } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import type { AdminAuthProviderConfiguration } from '@cloudbeaver/core-sdk';
import { useStyles } from '@cloudbeaver/core-theming';
import { TabsState, TabList, UNDERLINE_TAB_STYLES, TabPanelList, BASE_TAB_STYLES } from '@cloudbeaver/core-ui';

import { AuthConfigurationFormService } from './AuthConfigurationFormService';
import { authConfigurationContext } from './Contexts/authConfigurationContext';
import type { IAuthConfigurationFormState } from './IAuthConfigurationFormProps';

const tabsStyles = css`
  TabList {
    position: relative;
    flex-shrink: 0;
    align-items: center;
  }
  Tab {
    height: 46px!important;
    text-transform: uppercase;
    font-weight: 500 !important;
  }
`;

const topBarStyles = css`
    configuration-top-bar {
      composes: theme-border-color-background theme-background-secondary theme-text-on-secondary from global;
      position: relative;
      display: flex;
      padding-top: 16px;

      &:before {
        content: '';
        position: absolute;
        bottom: 0;
        width: 100%;
        border-bottom: solid 2px;
        border-color: inherit;
      }
    }
    configuration-top-bar-tabs {
      flex: 1;
    }

    configuration-top-bar-actions {
      display: flex;
      align-items: center;
      padding: 0 24px;
      gap: 16px;
    }

    configuration-status-message {
      composes: theme-typography--caption from global;
      height: 24px;
      padding: 0 16px;
      display: flex;
      align-items: center;
      gap: 8px;

      & IconOrImage {
        height: 24px;
        width: 24px;
      }
    }
  `;

const formStyles = css`
    box {
      composes: theme-background-secondary theme-text-on-secondary from global;
      display: flex;
      flex-direction: column;
      flex: 1;
      height: 100%;
      overflow: auto;
    }
    content-box {
      composes: theme-background-secondary theme-border-color-background from global;
      position: relative;
      display: flex;
      flex: 1;
      flex-direction: column;
      overflow: auto;
    }
  `;

interface Props {
  state: IAuthConfigurationFormState;
  onCancel?: () => void;
  onSave?: (configuration: AdminAuthProviderConfiguration) => void;
  className?: string;
}

export const AuthConfigurationForm = observer<Props>(function AuthConfigurationForm({
  state,
  onCancel,
  onSave = () => { },
  className,
}) {
  const translate = useTranslate();
  const props = useObjectRef({ onSave });
  const style = [BASE_TAB_STYLES, tabsStyles, UNDERLINE_TAB_STYLES];
  const styles = useStyles(style, BASE_CONTAINERS_STYLES, topBarStyles, formStyles);
  const service = useService(AuthConfigurationFormService);

  useExecutor({
    executor: state.submittingTask,
    postHandlers: [function save(data, contexts) {
      const validation = contexts.getContext(service.configurationValidationContext);
      const state = contexts.getContext(service.configurationStatusContext);
      const config = contexts.getContext(authConfigurationContext);

      if (validation.valid && state.saved) {
        props.onSave(config);
      }
    }],
  });

  useEffect(() => {
    state.loadConfigurationInfo();
  }, []);

  return styled(styles)(
    <TabsState
      container={service.tabsContainer}
      state={state}
      onCancel={onCancel}
    >
      <box className={className}>
        <configuration-top-bar>
          <configuration-top-bar-tabs>
            <configuration-status-message>
              {state.statusMessage && (
                <>
                  <IconOrImage icon='/icons/info_icon.svg' />
                  {translate(state.statusMessage)}
                </>
              )}
            </configuration-status-message>
            <TabList style={style} disabled={false} />
          </configuration-top-bar-tabs>
          <configuration-top-bar-actions>
            <Placeholder container={service.actionsContainer} state={state} onCancel={onCancel} />
          </configuration-top-bar-actions>
        </configuration-top-bar>
        <content-box>
          <TabPanelList style={style} />
        </content-box>
      </box>
    </TabsState>
  );
});
