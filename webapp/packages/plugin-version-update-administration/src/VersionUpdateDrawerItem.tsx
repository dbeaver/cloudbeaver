/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import type { AdministrationItemDrawerProps } from '@cloudbeaver/core-administration';
import { s, Translate, useResource, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CachedMapAllKey } from '@cloudbeaver/core-resource';
import { TabIcon, Tab, TabTitle } from '@cloudbeaver/core-ui';
import { VersionResource } from '@cloudbeaver/core-version';
import { VersionUpdateService } from '@cloudbeaver/core-version-update';

import moduleStyles from './VersionUpdateDrawerItem.m.css';

export const VersionUpdateDrawerItem = observer<AdministrationItemDrawerProps>(function VersionUpdateDrawerItem({ item, onSelect, disabled }) {
  const translate = useTranslate();
  const versionUpdateService = useService(VersionUpdateService);
  const moduleStyle = useS(moduleStyles);

  useResource(VersionUpdateDrawerItem, VersionResource, CachedMapAllKey, { silent: true });

  return (
    <Tab tabId={item.name} disabled={disabled} title="version_update" onOpen={() => onSelect(item.name)}>
      <TabIcon className={s(moduleStyle, { iconOrImage: true })} icon="/icons/version_update.svg" />
      <TabTitle className={s(moduleStyle, { tabTitle: true })}>
        <Translate token="version_update" />
      </TabTitle>
      {versionUpdateService.newVersionAvailable && (
        <div className={s(moduleStyle, { icon: true })} title={translate('version_update_new_version_available')} />
      )}
    </Tab>
  );
});
