/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import styled from 'reshadow';

import { AUTH_PROVIDER_LOCAL_ID } from '@cloudbeaver/core-authentication';
import { Button, s, StatusMessage, useS, useStyles, useTranslate } from '@cloudbeaver/core-blocks';
import { ENotificationType } from '@cloudbeaver/core-events';
import type { UserInfo } from '@cloudbeaver/core-sdk';
import { BASE_TAB_STYLES, TabList, TabsState, UNDERLINE_TAB_BIG_STYLES, UNDERLINE_TAB_STYLES } from '@cloudbeaver/core-ui';

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

export const UserForm = observer<Props>(function UserForm({ user, state, onClose }) {
  const translate = useTranslate();
  const style = [BASE_TAB_STYLES, UNDERLINE_TAB_STYLES, UNDERLINE_TAB_BIG_STYLES];
  const styles = useStyles(style);
  const moduleStyle = useS(userFormStyles);

  const localProvider = user.linkedAuthProviders.includes(AUTH_PROVIDER_LOCAL_ID);

  return styled(styles)(
    <div className={s(moduleStyle, { flexBox: true })}>
      <TabsState>
        <div className={s(moduleStyle, { topBar: true })}>
          <div className={s(moduleStyle, { topBarTabs: true })}>
            <div className={s(moduleStyle, { statusMessage: true })}>
              <StatusMessage type={ENotificationType.Info} message={state.info.statusMessage} />
            </div>
            <TabList className={s(moduleStyle, { tabList: true })} aria-label="User Settings" style={style} disabled={state.info.disabled}>
              <UserInfoTab style={style} />
              {localProvider && <AuthenticationTab style={style} />}
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
          <UserInfoPanel user={user} style={style} />
          {localProvider && <AuthenticationPanel style={style} />}
        </div>
      </TabsState>
    </div>,
  );
});
