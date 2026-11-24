/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { Tab, TabTitle, type TabContainerTabComponent } from '@cloudbeaver/core-ui';
import { VersionUpdateService } from '@cloudbeaver/core-version-update';

export const VersionUpdateTab: TabContainerTabComponent = observer(function VersionUpdateTab(props) {
  const translate = useTranslate();
  const versionUpdateService = useService(VersionUpdateService);

  return (
    <Tab {...props} title={versionUpdateService.newVersionAvailable ? 'version_update_new_version_available' : undefined}>
      <TabTitle>{translate('plugin_version_update_administration_tab_title')}</TabTitle>
      {versionUpdateService.newVersionAvailable && (
        <span
          className="tw:ml-2 tw:size-2 tw:shrink-0 tw:rounded-full tw:bg-(--theme-primary)"
          role="img"
          aria-label={translate('version_update_new_version_available')}
        />
      )}
    </Tab>
  );
});
