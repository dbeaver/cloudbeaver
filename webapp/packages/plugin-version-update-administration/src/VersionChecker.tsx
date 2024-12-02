/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Cell, CellStyles, IconOrImage, SContext, type StyleRegistry, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { VersionResource, VersionService } from '@cloudbeaver/core-version';
import { VersionUpdateService } from '@cloudbeaver/core-version-update';

import VersionCheckerCellStyles from './VersionCheckerCellStyles.module.css';

const registry: StyleRegistry = [
  [
    CellStyles,
    {
      mode: 'append',
      styles: [VersionCheckerCellStyles],
    },
  ],
];

export const VersionChecker = observer(function VersionChecker() {
  const translate = useTranslate();
  const versionUpdateService = useService(VersionUpdateService);
  const versionService = useService(VersionService);
  const versionResource = useService(VersionResource);

  const icon = versionUpdateService.newVersionAvailable ? '/icons/info_icon.svg' : '/icons/success_icon.svg';
  const text = versionUpdateService.newVersionAvailable ? 'version_update_new_version_available' : 'version_update_version_is_up_to_date';
  const description =
    versionService.current && versionResource.latest
      ? `${translate('version_current')}: ${versionService.current}, ${translate('version_latest')}: ${versionResource.latest.number}`
      : '';

  return (
    <SContext registry={registry}>
      <Cell
        before={<IconOrImage icon={icon} width={32} />}
        description={versionUpdateService.newVersionAvailable ? description : undefined}
        ripple={false}
        big
      >
        {translate(text)}
      </Cell>
    </SContext>
  );
});
