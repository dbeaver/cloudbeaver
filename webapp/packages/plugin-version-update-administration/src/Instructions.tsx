/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { BASE_CONTAINERS_STYLES, Group, GroupItem, GroupTitle } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';

const style = css`
  Group {
    composes: theme-typography--body2 from global;
  }
  GroupItem {
    white-space: pre-line;
  }
  ol {
    margin: 0;
    padding: 0;
  }
`;

export const Instructions = observer(function Instructions() {
  const translate = useTranslate();
  const styles = useStyles(BASE_CONTAINERS_STYLES, style);

  return styled(styles)(
    <Group form gap>
      <GroupTitle>{translate('version_update_how_to_update')}</GroupTitle>
      <GroupItem>
        <ol>
          <li>First, you’ll need to use the <strong>docker ps</strong> command to see a list of all containers currently running on your system.</li>
          <li>Then, stop the existing container by running the <strong>docker stop</strong> command.</li>
          <li>After stopping the running container, you can now use the <strong>docker rm</strong> command to remove it.</li>
          <li>Next, you can look for the version of the image you need to update to. To download the image from Docker Hub, you can use the <strong>docker pull</strong> command. </li>
          <li>After downloading the new image, you can use it to recreate the container by executing the <strong>docker run</strong> command. </li>
        </ol>
      </GroupItem>
    </Group>
  );
});
