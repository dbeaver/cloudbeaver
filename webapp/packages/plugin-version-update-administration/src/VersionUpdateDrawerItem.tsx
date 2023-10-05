/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import type { AdministrationItemDrawerProps } from '@cloudbeaver/core-administration';
import { Translate, useResource, useStyles, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CachedMapAllKey } from '@cloudbeaver/core-resource';
import { Tab, TabIcon, TabTitle } from '@cloudbeaver/core-ui';
import { VersionResource } from '@cloudbeaver/core-version';
import { VersionUpdateService } from '@cloudbeaver/core-version-update';

const styles = css`
  tab-container {
    justify-content: space-between;
  }
  TabTitle {
    flex: 1;
  }
  icon {
    composes: theme-background-primary from global;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
    margin-right: 12px;
  }
  IconOrImage {
    width: 16px;
  }
`;

export const VersionUpdateDrawerItem = observer<AdministrationItemDrawerProps>(function VersionUpdateDrawerItem({ item, onSelect, style, disabled }) {
  const translate = useTranslate();
  const versionUpdateService = useService(VersionUpdateService);

  useResource(VersionUpdateDrawerItem, VersionResource, CachedMapAllKey, { silent: true });

  return styled(useStyles(style, styles))(
    <Tab tabId={item.name} disabled={disabled} title="version_update" style={styles} onOpen={() => onSelect(item.name)}>
      <TabIcon icon="/icons/version_update.svg" />
      <TabTitle>
        <Translate token="version_update" />
      </TabTitle>
      {versionUpdateService.newVersionAvailable && <icon title={translate('version_update_new_version_available')} />}
    </Tab>,
  );
});
