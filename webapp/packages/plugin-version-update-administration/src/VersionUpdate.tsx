/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';
import { gte } from 'semver';

import type { AdministrationItemContentComponent } from '@cloudbeaver/core-administration';
import { ColoredContainer, useResource, useStyles } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CachedMapAllKey } from '@cloudbeaver/core-resource';
import { VersionResource, VersionService } from '@cloudbeaver/core-version';
import { VersionUpdateService } from '@cloudbeaver/core-version-update';

import { VersionChecker } from './VersionChecker';
import { VersionSelector } from './VersionSelector';

const styles = css`
  ColoredContainer {
    composes: theme-typography--body2 from global;
    list-style-position: inside;
  }
`;

export const VersionUpdate: AdministrationItemContentComponent = observer(function VersionUpdate() {
  const style = useStyles(styles);
  const versionService = useService(VersionService);
  const versionUpdateService = useService(VersionUpdateService);
  const versionResource = useResource(VersionUpdate, VersionResource, CachedMapAllKey, {
    silent: true,
  });

  const GeneralInstructions = versionUpdateService.generalInstructionsGetter?.();
  const versions = versionResource.resource.values.filter(v => gte(v.number, versionService.current));

  return styled(style)(
    <ColoredContainer wrap gap overflow parent>
      <VersionChecker />
      {versions.length > 0 && (
        <>
          {GeneralInstructions && <GeneralInstructions />}
          <VersionSelector versions={versions} />
        </>
      )}
    </ColoredContainer>,
  );
});
