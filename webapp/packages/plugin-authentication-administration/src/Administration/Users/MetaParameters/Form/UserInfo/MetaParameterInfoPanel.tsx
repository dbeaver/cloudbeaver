/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import styled from 'reshadow';

import { useStyles } from '@cloudbeaver/core-blocks';
import type { UserInfo } from '@cloudbeaver/core-sdk';
import type { ComponentStyle } from '@cloudbeaver/core-theming';
import { TabPanel } from '@cloudbeaver/core-ui';

import { MetaParametersForm } from './MetaParametersForm';

interface Props {
  user: UserInfo;
  className?: string;
  style?: ComponentStyle;
}

export const MetaParameterInfoPanel = observer<Props>(function MetaParameterInfoPanel({ user, className, style }) {
  const styles = useStyles(style);

  return styled(styles)(
    <TabPanel tabId="info" className={className}>
      <MetaParametersForm user={user} />
    </TabPanel>,
  );
});
