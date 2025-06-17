/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Cell, IconOrImage, Link, useTranslate } from '@cloudbeaver/core-blocks';
import { observer } from 'mobx-react-lite';
import { WEBSITE_LINKS } from '@cloudbeaver/core-links';

export const WelcomeDocs = observer(function WelcomeDocs() {
  const translate = useTranslate();
  return (
    <Link href={WEBSITE_LINKS.DOCS_PAGE} target="_blank" wrapper>
      <Cell
        before={<IconOrImage icon="/icons/documentation_link.svg" />}
        description={translate('plugin_help_welcome_docs_description')}
        className="tw:cursor-pointer tw:rounded-sm tw:overflow-hidden"
        big
      >
        {translate('plugin_help_welcome_docs_label')}
      </Cell>
    </Link>
  );
});
