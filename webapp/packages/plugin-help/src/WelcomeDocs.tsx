/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Cell, IconOrImage, useTranslate } from '@cloudbeaver/core-blocks';
import { observer } from 'mobx-react-lite';
import { WEBSITE_LINKS } from '@cloudbeaver/core-links';
import { GlobalConstants } from '@cloudbeaver/core-utils';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import { useService } from '@cloudbeaver/core-di';

export const WelcomeDocs = observer(function WelcomeDocs() {
  const translate = useTranslate();
  const serverConfigResource = useService(ServerConfigResource);
  return (
    <a
      href={WEBSITE_LINKS.getDocumentationPage(serverConfigResource.distributed, GlobalConstants.version)}
      target="_blank"
      rel="noreferrer"
      className="tw:text-inherit! tw:no-underline!"
    >
      <Cell
        before={<IconOrImage icon="/icons/documentation_link.svg" />}
        description={translate('plugin_help_welcome_docs_description', undefined, {
          product: serverConfigResource.distributed ? 'DBeaver Team Edition' : 'CloudBeaver',
        })}
        big
      >
        {translate('plugin_help_welcome_docs_label')}
      </Cell>
    </a>
  );
});
