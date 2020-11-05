/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled from 'reshadow';

import { TabTitle, Tab, TabContainerTabComponent } from '@cloudbeaver/core-blocks';
import { Translate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';

import { IConnectionFormProps } from '../ConnectionFormService';

export const OriginInfoTab: TabContainerTabComponent<IConnectionFormProps> = observer(function OriginInfoTab({
  model,
  controller,
  style,
  ...rest
}) {
  return styled(useStyles(style))(
    <Tab {...rest} style={style}>
      <TabTitle><Translate token={model.connection.origin.displayName} /></TabTitle>
    </Tab>
  );
});
