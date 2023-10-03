/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import styled from 'reshadow';

import { UsersResource } from '@cloudbeaver/core-authentication';
import { Translate, useResource, useStyles } from '@cloudbeaver/core-blocks';
import { FormMode, Tab, TabContainerTabComponent, TabTitle } from '@cloudbeaver/core-ui';

import type { UserFormProps } from '../AdministrationUserFormService';
import { getUserFormOriginTabId } from './getUserFormOriginTabId';

export const UserFormOriginInfoTab: TabContainerTabComponent<UserFormProps> = observer(function UserFormOriginInfoTab({
  tabId,
  formState: { mode, state },
  style,
  ...rest
}) {
  const editing = mode === FormMode.Edit;
  const userInfo = useResource(UserFormOriginInfoTab, UsersResource, state.userId, { active: editing });
  const origin = userInfo.data?.origins.find(origin => getUserFormOriginTabId('origin', origin) === tabId);
  return styled(useStyles(style))(
    <Tab {...rest} tabId={tabId} style={style}>
      <TabTitle>
        <Translate token={origin?.displayName || 'Origin'} />
      </TabTitle>
    </Tab>,
  );
});
