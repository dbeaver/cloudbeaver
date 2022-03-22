/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import ReactMarkdown from 'react-markdown';
import styled, { css } from 'reshadow';

import { BASE_CONTAINERS_STYLES, Container, Group, GroupItem, GroupTitle, useMapResource } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';
import { VersionResource } from '@cloudbeaver/core-version';

interface Props {
  item: string;
}

const style = css`
  Group {
    list-style-position: inside;
    height: 100%;
    max-height: 300px;
  }
  ReactMarkdown > * {
    margin: 0;
    padding: 0;
  }
`;

export const VersionInfo = observer<Props>(function VersionInfo({ item }) {
  const translate = useTranslate();
  const styles = useStyles(BASE_CONTAINERS_STYLES, style);
  const versionResource = useMapResource(VersionInfo, VersionResource, item);

  const version = versionResource.data;

  return styled(styles)(
    <Container wrap gap overflow large>
      <Group gap overflow>
        <GroupTitle>{version ? `Release notes ${version.number} - ${version.date}` : translate('version_update_version_no_info')}</GroupTitle>
        {version && (
          <GroupItem>
            <ReactMarkdown>{version.releaseNotes}</ReactMarkdown>
          </GroupItem>
        )}
      </Group>
    </Container>
  );
});
