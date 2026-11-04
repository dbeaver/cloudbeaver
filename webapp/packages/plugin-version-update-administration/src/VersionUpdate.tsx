/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import {
  AdministrationPageContent,
  AdministrationPageHeader,
  AdministrationPageTitle,
  type AdministrationItemContentProps,
} from '@cloudbeaver/core-administration';
import { s, useResource, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CachedMapAllKey } from '@cloudbeaver/core-resource';
import type { TabContainerPanelComponent } from '@cloudbeaver/core-ui';
import { VersionResource, VersionService } from '@cloudbeaver/core-version';
import { VersionUpdateService } from '@cloudbeaver/core-version-update';

import { VersionChecker } from './VersionChecker.js';
import { VersionSelector } from './VersionSelector.js';
import styles from './VersionUpdate.module.css';

export const VersionUpdate: TabContainerPanelComponent<AdministrationItemContentProps> = observer(function VersionUpdate() {
  const translate = useTranslate();
  const style = useS(styles);
  const versionService = useService(VersionService);
  const versionUpdateService = useService(VersionUpdateService);
  const versionResource = useResource(VersionUpdate, VersionResource, CachedMapAllKey, {
    silent: true,
  });

  const GeneralInstructions = versionUpdateService.generalInstructionsGetter?.();
  const versions = versionResource.resource.values.filter(v => versionService.greaterOrEqual(v.number, versionService.current));

  return (
    <>
      <AdministrationPageHeader>
        <AdministrationPageTitle docLink={versionUpdateService.instructionLink ?? undefined}>
          {translate('plugin_version_update_administration_tab_title')}
        </AdministrationPageTitle>
      </AdministrationPageHeader>
      <AdministrationPageContent>
        <div className={s(style, { content: true })}>
          <VersionChecker />
          {versions.length > 0 && (
            <>
              {GeneralInstructions && <GeneralInstructions />}
              <VersionSelector versions={versions} />
            </>
          )}
        </div>
      </AdministrationPageContent>
    </>
  );
});
