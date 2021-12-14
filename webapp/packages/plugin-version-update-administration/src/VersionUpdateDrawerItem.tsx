/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import type { AdministrationItemDrawerProps } from '@cloudbeaver/core-administration';
import { Tab, TabTitle, TabIcon, IconOrImage, useMapResource } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { Translate, useTranslate } from '@cloudbeaver/core-localization';
import { CachedMapAllKey } from '@cloudbeaver/core-sdk';
import { useStyles } from '@cloudbeaver/core-theming';
import { VersionResource } from '@cloudbeaver/core-version';
import { VersionUpdateService } from '@cloudbeaver/core-version-update';

const styles = css`
  tab-container {
    justify-content: space-between;
  }
  content {
    display: flex;
    align-items: center;
  }
  icon-container {
    display: flex;
  }
  IconOrImage {
    width: 16px;
  }
`;

export const VersionUpdateDrawerItem = observer<AdministrationItemDrawerProps>(function VersionUpdateDrawerItem({
  item, onSelect, style, disabled,
}) {
  const translate = useTranslate();
  const versionUpdateService = useService(VersionUpdateService);
  useMapResource(VersionUpdateDrawerItem, VersionResource, CachedMapAllKey);

  return styled(useStyles(style, styles))(
    <Tab
      tabId={item.name}
      disabled={disabled}
      title='version_update'
      style={styles}
      onOpen={() => onSelect(item.name)}
    >
      <content>
        <TabIcon icon='/icons/identity_providers.svg' />
        <TabTitle><Translate token='version_update' /></TabTitle>
      </content>
      {versionUpdateService.newVersionAvailable && (
        <icon-container title={translate('version_update_new_version_available')}>
          <IconOrImage icon='order-arrow-up' />
        </icon-container>
      )}
    </Tab>
  );
});
