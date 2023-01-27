/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { AUTH_PROVIDER_LOCAL_ID } from '@cloudbeaver/core-authentication';
import { BASE_CONTAINERS_STYLES, Button, IconOrImage, useStyles, useTranslate } from '@cloudbeaver/core-blocks';
import type { UserInfo } from '@cloudbeaver/core-sdk';
import { BASE_TAB_STYLES, TabList, TabsState, UNDERLINE_TAB_STYLES } from '@cloudbeaver/core-ui';

import { AuthenticationPanel } from './Authentication/AuthenticationPanel';
import { AuthenticationTab } from './Authentication/AuthenticationTab';
import type { IUserProfileFormState } from './IUserProfileFormState';
import { UserInfoPanel } from './UserInfo/UserInfoPanel';
import { UserInfoTab } from './UserInfo/UserInfoTab';

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
    top-bar {
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
    top-bar-tabs {
      flex: 1;
    }

    top-bar-actions {
      display: flex;
      align-items: center;
      padding: 0 24px;
      gap: 16px;
    }

    /*Button:not(:first-child) {
      margin-right: 24px;
    }*/

    status-message {
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
    }
    flex-box {
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
  user: UserInfo;
  state: IUserProfileFormState;
  onClose?: () => void;
}

export const UserForm = observer<Props>(function UserForm({
  user,
  state,
  onClose,
}) {
  const translate = useTranslate();
  const style = [BASE_TAB_STYLES, tabsStyles, UNDERLINE_TAB_STYLES];
  const styles = useStyles(style, BASE_CONTAINERS_STYLES, topBarStyles, formStyles);

  const localProvider = user.linkedAuthProviders.includes(AUTH_PROVIDER_LOCAL_ID);

  return styled(styles)(
    <flex-box>
      <TabsState>
        <top-bar>
          <top-bar-tabs>
            <status-message>
              {state.info.statusMessage && (
                <>
                  <IconOrImage icon='/icons/info_icon.svg' />
                  {translate(state.info.statusMessage)}
                </>
              )}
            </status-message>
            <TabList aria-label='User Settings' style={style} disabled={state.info.disabled}>
              <UserInfoTab style={style} />
              {localProvider && <AuthenticationTab style={style} />}
              {/* <UserAuthProvidersTab style={style} /> */}
            </TabList>
          </top-bar-tabs>
          <top-bar-actions>
            {onClose && (
              <Button
                type="button"
                mod={['outlined']}
                onClick={onClose}
              >
                {translate('ui_processing_cancel')}
              </Button>
            )}
          </top-bar-actions>
        </top-bar>
        <content-box>
          <UserInfoPanel user={user} style={style} />
          {localProvider && <AuthenticationPanel style={style} />}
          {/* <UserAuthProviderPanel user={user} style={style} /> */}
        </content-box>
      </TabsState>
    </flex-box>
  );
});
