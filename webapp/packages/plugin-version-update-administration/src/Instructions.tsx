/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { BASE_CONTAINERS_STYLES, Group, GroupItem, GroupTitle, useMapResource } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import { CachedMapAllKey } from '@cloudbeaver/core-sdk';
import { useStyles } from '@cloudbeaver/core-theming';
import { VersionResource } from '@cloudbeaver/core-version';
import { VersionUpdateService } from '@cloudbeaver/core-version-update';

const style = css`
  Group {
    composes: theme-typography--body2 from global;
  }
  GroupItem {
    white-space: pre-line;
  }
`;

export const Instructions = observer(function Instructions() {
  const translate = useTranslate();
  const styles = useStyles(BASE_CONTAINERS_STYLES, style);
  const versionUpdateService = useService(VersionUpdateService);
  const versionResource = useMapResource(Instructions, VersionResource, CachedMapAllKey);

  if (!versionUpdateService.instructionGetter) {
    return null;
  }

  const Instruction = versionUpdateService.instructionGetter();
  return styled(styles)(
    <Group form gap>
      <GroupTitle>{translate('version_update_how_to_update')}</GroupTitle>
      <GroupItem>
        <Instruction versions={versionResource.resource.values} />
      </GroupItem>
    </Group>
  );
});
