/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { BASE_CONTAINERS_STYLES, Group, GroupItem, GroupTitle } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';

const style = css`
  GroupItem {
    white-space: pre-line;
  }
  h4 {
    margin: 0;
  }
`;

export const Recommendations = observer(function Recommendations() {
  const translate = useTranslate();
  return styled(BASE_CONTAINERS_STYLES, style)(
    <Group gap large>
      <GroupTitle>{translate('version_update_recommendations')}</GroupTitle>
      <GroupItem>
        <h4>
          We highly recommend avoiding product downgrade. We cannot guarantee the proper work of the application after this procedure.
        </h4>
      </GroupItem>
    </Group>
  );
});