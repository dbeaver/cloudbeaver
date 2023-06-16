/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import styled from 'reshadow';

import type { ComponentStyle } from '@cloudbeaver/core-theming';
import { Tab } from '@cloudbeaver/core-ui';

interface Props {
  className?: string;
  style?: ComponentStyle;
}

export const MetaParameterInfoTab = observer<Props>(function MetaParameterInfoTab({ className, style }) {
  const translate = useTranslate();
  const styles = useStyles(style);

  return styled(styles)(
    <Tab tabId="info" style={style} className={className}>
      {translate('plugin_user_profile_info')}
    </Tab>,
  );
});
