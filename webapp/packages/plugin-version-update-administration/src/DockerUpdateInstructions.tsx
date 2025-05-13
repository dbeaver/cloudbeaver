/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Group, GroupItem, GroupTitle, s, useS, useTranslate } from '@cloudbeaver/core-blocks';

import styles from './DockerUpdateInstructions.module.css';

export const DockerUpdateInstructions = observer(function DockerUpdateInstructions() {
  const translate = useTranslate();
  const style = useS(styles);

  return (
    <Group gap large>
      <GroupTitle>{translate('version_update_how_to_update')}</GroupTitle>
      <GroupItem className={s(style, { groupItem: true })}>
        <h4 className="tw:mb-4">
          <b>The following instructions apply only when you run CloudBeaver in a Docker container.</b>
        </h4>
        <ol className="tw:list-decimal tw:list-inside">
          <li>
            Stop the existing container by running the <strong>docker stop</strong> command.
          </li>
          <li>
            Use the <strong>docker rm</strong> command to remove it.
          </li>
          <li>
            Use the <strong>docker pull</strong> command to download the image from the Docker Hub.{' '}
          </li>
          <li>
            Re-create the container by executing the <strong>docker run</strong> command.{' '}
          </li>
        </ol>
      </GroupItem>
    </Group>
  );
});
