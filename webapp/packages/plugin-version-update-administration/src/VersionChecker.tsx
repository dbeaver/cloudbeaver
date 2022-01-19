/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { BASE_CONTAINERS_STYLES, Cell, IconOrImage } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';
import { VersionResource, VersionService } from '@cloudbeaver/core-version';
import { VersionUpdateService } from '@cloudbeaver/core-version-update';

const style = css`
  before {
    width: 40px;
    height: 40px;
  }
`;

export const VersionChecker = observer(function VersionChecker() {
  const styles = useStyles(BASE_CONTAINERS_STYLES);
  const translate = useTranslate();
  const versionUpdateService = useService(VersionUpdateService);
  const versionService = useService(VersionService);
  const versionResource = useService(VersionResource);

  const icon = versionUpdateService.newVersionAvailable ? '/icons/info_icon.svg' : '/icons/success_icon.svg';
  const text = versionUpdateService.newVersionAvailable ? 'version_update_new_version_available' : 'version_update_version_is_up_to_date';
  const description = versionService.current && versionResource.latest
    ? `${translate('version_current')}: ${versionService.current}, ${translate('version_latest')}: ${versionResource.latest.number}` : '';

  return styled(styles)(
    <Cell
      before={<IconOrImage icon={icon} />}
      description={versionUpdateService.newVersionAvailable ? description : undefined}
      style={style}
    >
      {translate(text)}
    </Cell>
  );
});
