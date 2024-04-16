/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import type { AdministrationItemContentComponent } from '@cloudbeaver/core-administration';
import { ColoredContainer, s, useResource, useS } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CachedMapAllKey } from '@cloudbeaver/core-resource';
import { VersionResource, VersionService } from '@cloudbeaver/core-version';
import { VersionUpdateService } from '@cloudbeaver/core-version-update';

import { VersionChecker } from './VersionChecker';
import { VersionSelector } from './VersionSelector';
import styles from './VersionUpdate.m.css';

export const VersionUpdate: AdministrationItemContentComponent = observer(function VersionUpdate() {
  const style = useS(styles);
  const versionService = useService(VersionService);
  const versionUpdateService = useService(VersionUpdateService);
  const versionResource = useResource(VersionUpdate, VersionResource, CachedMapAllKey, {
    silent: true,
  });

  const GeneralInstructions = versionUpdateService.generalInstructionsGetter?.();
  const versions = versionResource.resource.values.filter(v => versionService.greaterOrEqual(v.number, versionService.current));

  return (
    <ColoredContainer className={s(style, { coloredContainer: true })} wrap gap overflow parent>
      <VersionChecker />
      {versions.length > 0 && (
        <>
          {GeneralInstructions && <GeneralInstructions />}
          <VersionSelector versions={versions} />
        </>
      )}
    </ColoredContainer>
  );
});
