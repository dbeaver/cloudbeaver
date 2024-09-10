/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { AdministrationItemDrawerProps } from '@cloudbeaver/core-administration';
import { s, Translate, useResource, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CachedMapAllKey } from '@cloudbeaver/core-resource';
import { Tab, TabIcon, TabTitle } from '@cloudbeaver/core-ui';
import { VersionResource } from '@cloudbeaver/core-version';
import { VersionUpdateService } from '@cloudbeaver/core-version-update';

import style from './ProductInfoDrawerItem.module.css';

export const ProductInfoDrawerItem: React.FC<AdministrationItemDrawerProps> = function ProductInfoDrawerItem({ item, onSelect, disabled }) {
  const styles = useS(style);
  const versionUpdateService = useService(VersionUpdateService);
  const newVersionAvailable = versionUpdateService.newVersionAvailable;
  const translate = useTranslate();

  useResource(ProductInfoDrawerItem, VersionResource, CachedMapAllKey, { silent: true });

  return (
    <Tab
      title={translate(newVersionAvailable ? 'version_update_new_version_available' : undefined)}
      tabId={item.name}
      disabled={disabled}
      onOpen={() => onSelect(item.name)}
    >
      <TabIcon icon="/icons/license.svg" viewBox="0 0 16 16" />
      <TabTitle>
        <Translate token="administration_settings_menu_title" />
      </TabTitle>
      {newVersionAvailable && <div className={s(styles, { icon: true })} />}
    </Tab>
  );
};
