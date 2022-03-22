/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';
import { gte } from 'semver';

import type { AdministrationItemContentComponent } from '@cloudbeaver/core-administration';
import { BASE_CONTAINERS_STYLES, ColoredContainer, useMapResource } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CachedMapAllKey } from '@cloudbeaver/core-sdk';
import { useStyles } from '@cloudbeaver/core-theming';
import { VersionResource, VersionService } from '@cloudbeaver/core-version';

import { Instructions } from './Instructions';
import { Recommendations } from './Recommendations';
import { VersionChecker } from './VersionChecker';
import { VersionSelector } from './VersionSelector';

const styles = css`
  ColoredContainer {
    composes: theme-typography--body2 from global;
    list-style-position: inside;
  }
`;

export const VersionUpdate: AdministrationItemContentComponent = observer(function VersionUpdate() {
  const style = useStyles(BASE_CONTAINERS_STYLES, styles);
  const versionService = useService(VersionService);
  const versionResource = useMapResource(VersionUpdate, VersionResource, CachedMapAllKey);

  const versions = versionResource.resource.values.filter(v => gte(v.number, versionService.current));

  return styled(style)(
    <ColoredContainer wrap gap overflow parent>
      <VersionChecker />
      {versions.length > 0 && (
        <>
          <Instructions />
          <VersionSelector versions={versions} />
        </>
      )}
      <Recommendations />
    </ColoredContainer>
  );
});
