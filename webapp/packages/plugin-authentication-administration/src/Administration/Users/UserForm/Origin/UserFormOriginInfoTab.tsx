/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Translate } from '@cloudbeaver/core-blocks';
import { Tab, TabContainerTabComponent, TabTitle } from '@cloudbeaver/core-ui';

import type { UserFormProps } from '../AdministrationUserFormService';

export const UserFormOriginInfoTab: TabContainerTabComponent<UserFormProps> = observer(function UserFormOriginInfoTab({ tabId, ...rest }) {
  return (
    <Tab {...rest} tabId={tabId}>
      <TabTitle>
        <Translate token="authentication_administration_user_auth_methods" />
      </TabTitle>
    </Tab>
  );
});
