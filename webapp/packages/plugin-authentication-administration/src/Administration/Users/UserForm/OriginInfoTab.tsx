/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled from 'reshadow';

import { TabTitle, Tab, TabContainerTabComponent } from '@cloudbeaver/core-ui';
import { Translate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';

import { getOriginTabId } from './getOriginTabId';
import type { IUserFormProps } from './UserFormService';

export const OriginInfoTab: TabContainerTabComponent<IUserFormProps> = observer(function OriginInfoTab({
  tabId,
  user,
  controller,
  editing,
  style,
  ...rest
}) {
  const origin = user.origins.find(origin => getOriginTabId('origin', origin) === tabId);
  return styled(useStyles(style))(
    <Tab
      {...rest}
      tabId={tabId}
      style={style}
    >
      <TabTitle><Translate token={origin?.displayName || 'Origin'} /></TabTitle>
    </Tab>
  );
});
