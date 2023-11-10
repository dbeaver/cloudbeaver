/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { Group, GroupItem, GroupTitle, useTranslate } from '@cloudbeaver/core-blocks';

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
  return styled(style)(
    <Group gap large>
      <GroupTitle>{translate('plugin_version_update_administration_recommendations_label')}</GroupTitle>
      <GroupItem>
        <h4>{translate('plugin_version_update_administration_recommendations')}</h4>
      </GroupItem>
    </Group>,
  );
});
