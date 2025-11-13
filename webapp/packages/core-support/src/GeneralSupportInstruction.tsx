/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Link, Text, useTranslate } from '@cloudbeaver/core-blocks';
import { WEBSITE_LINKS } from '@cloudbeaver/core-links';

export const GeneralSupportInstruction: React.FC = function GeneralSupportInstruction() {
  const translate = useTranslate();

  return (
    <div>
      <Text className="tw:text-xs tw:text-center">
        {translate('core_support_description')}
        <Link href={WEBSITE_LINKS.TECH_SUPPORT_PAGE} target="_blank" rel="noopener noreferrer" inline indicator>
          {translate('core_support')}
        </Link>
      </Text>
    </div>
  );
};
