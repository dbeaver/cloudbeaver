/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import styled from 'reshadow';

import { UserMetaParametersResource } from '@cloudbeaver/core-authentication';
import { Container, ObjectPropertyInfoForm, useResource, useStyles } from '@cloudbeaver/core-blocks';
import type { UserInfo } from '@cloudbeaver/core-sdk';
import type { ComponentStyle } from '@cloudbeaver/core-theming';

interface Props {
  user: UserInfo;
  className?: string;
  style?: ComponentStyle;
}

export const MetaParameterInfoForm = observer<Props>(function MetaParameterInfoForm({ user, className, style }) {
  const userMetaParameters = useResource(MetaParameterInfoForm, UserMetaParametersResource, undefined);
  const styles = useStyles(style);

  if (!userMetaParameters.data.length) {
    return null;
  }

  return styled(styles)(
    <Container className={className} wrap gap>
      <ObjectPropertyInfoForm state={user.metaParameters} properties={userMetaParameters.data} category={null} disabled readOnly />
    </Container>,
  );
});
