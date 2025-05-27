/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { type AuthProviderConfiguration, AuthProvidersResource, UserInfoResource } from '@cloudbeaver/core-authentication';
import { Button, Cell, Container, IconOrImage, Link, s, useResource, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CachedMapAllKey } from '@cloudbeaver/core-resource';
import { AuthenticationService } from '@cloudbeaver/plugin-authentication';

import styles from './UserActiveAuthMethods.module.css';

interface Props {
  className?: string;
}

export const UserActiveAuthMethods = observer<Props>(function UserActiveAuthMethods({ className }) {
  const user = useResource(UserActiveAuthMethods, UserInfoResource, undefined);
  const providersResource = useResource(UserActiveAuthMethods, AuthProvidersResource, CachedMapAllKey);
  const authenticationService = useService(AuthenticationService);
  const style = useS(styles);
  const translate = useTranslate();

  if (!user.data) {
    return null;
  }

  return (
    <Container className={className}>
      <div className={s(style, { list: true })}>
        {user.data?.authTokens.map(token => {
          const provider = providersResource.resource.get(token.authProvider);

          if (!provider) {
            return null;
          }

          let configuration: AuthProviderConfiguration | undefined;
          let name = provider.label;
          let description = token.message || provider.description;
          let icon = provider.icon;

          if (token.authConfiguration) {
            configuration = provider.configurations?.find(configuration => configuration.id === token.authConfiguration);

            if (configuration) {
              name = configuration.displayName;
              description = configuration.description;

              if (configuration.iconURL) {
                icon = configuration.iconURL;
              }
            }
          }

          const date = new Date(token.loginTime);
          const title = `${name}\n${description || ''}`;

          return (
            <Link key={provider.id + '_' + token.authConfiguration} title={title} wrapper>
              <Cell
                className={s(style, { cell: true })}
                before={icon ? <IconOrImage className={s(style, { iconOrImage: true })} icon={icon} /> : undefined}
                after={
                  <Button variant="secondary" onClick={() => authenticationService.logout(provider.id, configuration?.id)}>
                    {translate('authentication_logout')}
                  </Button>
                }
                description={
                  <>
                    {description}
                    <br />
                    {token.userId && (
                      <>
                        {token.userId}
                        <br />
                      </>
                    )}
                    {date ? (
                      <time className={s(style, { time: true })} dateTime={date.toLocaleString()}>
                        {date.toLocaleString()}
                      </time>
                    ) : undefined}
                  </>
                }
              >
                {name}
              </Cell>
            </Link>
          );
        })}
      </div>
    </Container>
  );
});
