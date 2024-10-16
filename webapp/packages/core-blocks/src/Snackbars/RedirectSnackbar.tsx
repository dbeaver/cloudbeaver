/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import type React from 'react';

import { Container, Link, SnackbarBody, SnackbarContent, SnackbarStatus, SnackbarWrapper, Text, useTranslate } from '@cloudbeaver/core-blocks';
import type { INotificationExtraProps, NotificationComponent } from '@cloudbeaver/core-events';

export interface RedirectSnackbarProps extends INotificationExtraProps {
  link: React.ComponentProps<typeof Link>;
}

export const RedirectSnackbar: NotificationComponent<RedirectSnackbarProps> = observer(function RedirectSnackbar({ notification, link }) {
  const translate = useTranslate();

  return (
    <SnackbarWrapper persistent={notification.persistent} onClose={() => notification.close(false)}>
      <SnackbarStatus status={notification.type} />
      <SnackbarContent>
        <SnackbarBody title={translate(notification.title)}>
          <Container keepSize dense gap>
            {notification.message && <Text>{translate(notification.message)}</Text>}
            <Link {...link}>{link.href}</Link>
          </Container>
        </SnackbarBody>
      </SnackbarContent>
    </SnackbarWrapper>
  );
});
