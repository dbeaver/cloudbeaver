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

import type { IConnectionFormProps } from '../IConnectionFormProps';

export const OriginInfoTab: TabContainerTabComponent<IConnectionFormProps> = observer(function OriginInfoTab({
  state: { info },
  style,
  ...rest
}) {
  return styled(useStyles(style))(
    <Tab {...rest} style={style}>
      <TabTitle><Translate token={info?.origin?.displayName || 'Origin'} /></TabTitle>
    </Tab>
  );
});
