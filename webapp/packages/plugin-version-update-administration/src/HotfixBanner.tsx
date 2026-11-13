/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useId } from 'react';

import { AdministrationScreenService } from '@cloudbeaver/core-administration';
import { Button, Icon, IconOrImage, s, useResource, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CachedMapAllKey } from '@cloudbeaver/core-resource';
import { VersionResource } from '@cloudbeaver/core-version';
import { VersionUpdateService } from '@cloudbeaver/core-version-update';
import { ProductInfoService } from '@cloudbeaver/plugin-product-information-administration';
import { IconButton } from '@dbeaver/ui-kit';

import { HotfixBannerService } from './HotfixBannerService.js';
import styles from './HotfixBanner.module.css';

export const HotfixBanner = observer(function HotfixBanner() {
  const translate = useTranslate();
  const style = useS(styles);
  const titleId = useId();
  const hotfixBannerService = useService(HotfixBannerService);
  const versionUpdateService = useService(VersionUpdateService);
  const administrationScreenService = useService(AdministrationScreenService);
  useResource(HotfixBanner, VersionResource, CachedMapAllKey, { silent: true });

  const title = translate('plugin_version_update_administration_hotfix_title');
  const description = translate('plugin_version_update_administration_hotfix_description');
  const version = versionUpdateService.latestHotfix?.number;

  if (!hotfixBannerService.visible) {
    return null;
  }

  return (
    <section className={s(style, { banner: true })} aria-labelledby={titleId}>
      <span className={s(style, { icon: true })} aria-hidden="true">
        <IconOrImage icon="/icons/preload/info_icon.svg" width={24} />
      </span>
      <div className={s(style, { content: true })}>
        <h2 id={titleId} className={s(style, { title: true })}>
          {title}
          <span className={s(style, { version: true })}>{version}</span>
        </h2>
        <p>{description}</p>
      </div>
      <Button
        size="small"
        variant="secondary"
        aria-describedby={titleId}
        onClick={() => administrationScreenService.navigateToItemSub(ProductInfoService.PAGE_NAME, 'version-update')}
      >
        {translate('plugin_version_update_administration_hotfix_details')}
      </Button>
      <IconButton
        size="medium"
        aria-label={translate('plugin_version_update_administration_hotfix_dismiss')}
        title={translate('plugin_version_update_administration_hotfix_dismiss')}
        onClick={hotfixBannerService.dismiss}
      >
        <span aria-hidden="true">
          <Icon name="cross" className="tw:size-4" />
        </span>
      </IconButton>
    </section>
  );
});
