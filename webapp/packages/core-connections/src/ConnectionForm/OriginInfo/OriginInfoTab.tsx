/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled from 'reshadow';

import { AuthProvidersResource } from '@cloudbeaver/core-authentication';
import { TabTitle, Tab, TabContainerTabComponent, useMapResource } from '@cloudbeaver/core-blocks';
import { Translate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';

import type { IConnectionFormProps } from '../IConnectionFormProps';

export const OriginInfoTab: TabContainerTabComponent<IConnectionFormProps> = observer(function OriginInfoTab({
  state: { info },
  style,
  ...rest
}) {
  const provider = useMapResource(AuthProvidersResource, info?.origin.subType ?? info?.origin.type ?? null);
  return styled(useStyles(style))(
    <Tab {...rest} title={provider.data?.description} style={style}>
      <TabTitle><Translate token={info?.origin.displayName || 'Origin'} /></TabTitle>
    </Tab>
  );
});
