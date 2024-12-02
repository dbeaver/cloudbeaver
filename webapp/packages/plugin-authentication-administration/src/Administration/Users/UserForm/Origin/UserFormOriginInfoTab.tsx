/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Translate } from '@cloudbeaver/core-blocks';
import { Tab, type TabContainerTabComponent, TabTitle } from '@cloudbeaver/core-ui';

import type { UserFormProps } from '../AdministrationUserFormService.js';

export const UserFormOriginInfoTab: TabContainerTabComponent<UserFormProps> = observer(function UserFormOriginInfoTab(props) {
  return (
    <Tab {...props}>
      <TabTitle>
        <Translate token="authentication_administration_user_auth_methods" />
      </TabTitle>
    </Tab>
  );
});
