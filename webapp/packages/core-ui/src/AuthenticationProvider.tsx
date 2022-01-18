/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { BASE_CONTAINERS_STYLES, Button, Container, GroupItem } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import type { ObjectOrigin } from '@cloudbeaver/core-sdk';
import { useStyles } from '@cloudbeaver/core-theming';

import { useAuthenticationAction } from './useAuthenticationAction';

const styles = css`
  Container {
    justify-content: center;
    align-items: center;
  }
`;

export type Props = {
  onAuthenticate?: () => void;
  onClose?: () => void;
  children?: () => React.ReactNode;
  className?: string;
} & ({
  origin: ObjectOrigin;
} | {
  type: string;
  subType?: string;
});

export const AuthenticationProvider = observer<Props>(function AuthenticationProvider(props) {
  const translate = useTranslate();
  const style = useStyles(styles, BASE_CONTAINERS_STYLES);
  const action = useAuthenticationAction(props);

  if (action.authorized) {
    return props.children?.() as null || null;
  }

  return styled(style)(
    <Container className={props.className} gap vertical>
      <GroupItem keepSize>
        {translate('authentication_request_token')}
      </GroupItem>
      <GroupItem keepSize>
        <Button
          type='button'
          mod={['unelevated']}
          onClick={action.auth}
        >
          {translate('authentication_authenticate')}
        </Button>
      </GroupItem>
    </Container>
  );
});
