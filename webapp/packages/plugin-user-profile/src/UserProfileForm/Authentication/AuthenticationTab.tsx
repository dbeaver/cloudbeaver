/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { useTranslate } from '@cloudbeaver/core-blocks';
import { Tab, TabTitle } from '@cloudbeaver/core-ui';

interface Props {
  className?: string;
}

export const AuthenticationTab = observer<Props>(function AuthenticationTab({ className }) {
  const translate = useTranslate();

  return (
    <Tab tabId="authentication" className={className}>
      <TabTitle>{translate('ui_authentication')}</TabTitle>
    </Tab>
  );
});
