/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import styled from 'reshadow';

import type { AdministrationItemDrawerProps } from '@cloudbeaver/core-administration';
import { s, Translate, useResource, useS, useStyles, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CachedMapAllKey } from '@cloudbeaver/core-resource';
import { Tab, TabIcon, TabTitle } from '@cloudbeaver/core-ui';
import { VersionResource } from '@cloudbeaver/core-version';
import { VersionUpdateService } from '@cloudbeaver/core-version-update';

import styles from './VersionUpdateDrawerItem.m.css';

export const VersionUpdateDrawerItem = observer<AdministrationItemDrawerProps>(function VersionUpdateDrawerItem({ item, onSelect, style, disabled }) {
  const translate = useTranslate();
  const versionUpdateService = useService(VersionUpdateService);
  const moduleStyle = useS(styles);

  useResource(VersionUpdateDrawerItem, VersionResource, CachedMapAllKey, { silent: true });

  return styled(useStyles(style))(
    <Tab
      сontainerClassName={s(moduleStyle, { tabContainer: true })}
      tabId={item.name}
      disabled={disabled}
      title="version_update"
      onOpen={() => onSelect(item.name)}
    >
      <TabIcon className={s(moduleStyle, { iconOrImage: true })} icon="/icons/version_update.svg" />
      <TabTitle className={s(moduleStyle, { tabTitle: true })}>
        <Translate token="version_update" />
      </TabTitle>
      {versionUpdateService.newVersionAvailable && (
        <div className={s(moduleStyle, { icon: true })} title={translate('version_update_new_version_available')} />
      )}
    </Tab>,
  );
});
