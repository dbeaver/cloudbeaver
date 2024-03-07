/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { AUTH_PROVIDER_LOCAL_ID } from '@cloudbeaver/core-authentication';
import { Button, s, SContext, StatusMessage, StyleRegistry, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { ENotificationType } from '@cloudbeaver/core-events';
import type { UserInfo } from '@cloudbeaver/core-sdk';
import { baseTabStyles, TabList, TabsState, underlineTabBigStyles, underlineTabStyles } from '@cloudbeaver/core-ui';

import { AuthenticationPanel } from './Authentication/AuthenticationPanel';
import { AuthenticationTab } from './Authentication/AuthenticationTab';
import type { IUserProfileFormState } from './IUserProfileFormState';
import userFormStyles from './UserForm.m.css';
import { UserInfoPanel } from './UserInfo/UserInfoPanel';
import { UserInfoTab } from './UserInfo/UserInfoTab';

interface Props {
  user: UserInfo;
  state: IUserProfileFormState;
  onClose?: () => void;
}

const registry: StyleRegistry = [[baseTabStyles, { mode: 'append', styles: [underlineTabStyles, underlineTabBigStyles] }]];

export const UserForm = observer<Props>(function UserForm({ user, state, onClose }) {
  const translate = useTranslate();
  const moduleStyle = useS(userFormStyles);

  const localProvider = user.linkedAuthProviders.includes(AUTH_PROVIDER_LOCAL_ID);

  return (
    <div className={s(moduleStyle, { box: true })}>
      <TabsState>
        <SContext registry={registry}>
          <div className={s(moduleStyle, { topBar: true })}>
            <div className={s(moduleStyle, { topBarTabs: true })}>
              <div className={s(moduleStyle, { statusMessage: true })}>
                <StatusMessage type={ENotificationType.Info} message={state.info.statusMessage} />
              </div>
              <TabList className={s(moduleStyle, { tabList: true })} aria-label="User Settings" disabled={state.info.disabled}>
                <UserInfoTab />
                {localProvider && <AuthenticationTab />}
              </TabList>
            </div>
            <div className={s(moduleStyle, { topBarActions: true })}>
              {onClose && (
                <Button type="button" mod={['outlined']} onClick={onClose}>
                  {translate('ui_processing_cancel')}
                </Button>
              )}
            </div>
          </div>
          <div className={s(moduleStyle, { contentBox: true })}>
            <UserInfoPanel user={user} />
            {localProvider && <AuthenticationPanel />}
          </div>
        </SContext>
      </TabsState>
    </div>
  );
});
