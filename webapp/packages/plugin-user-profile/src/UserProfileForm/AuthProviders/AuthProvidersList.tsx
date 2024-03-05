/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { AuthProvidersResource } from '@cloudbeaver/core-authentication';
import { Cell, getComputed, IconOrImage, Link, Loader, s, useResource, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { resourceKeyList } from '@cloudbeaver/core-resource';
import type { UserInfo } from '@cloudbeaver/core-sdk';

import styles from './AuthProvidersList.m.css';

interface Props {
  user: UserInfo;
  providers: string[];
  className?: string;
}

export const AuthProvidersList = observer<Props>(function AuthProvidersList({ user, providers, className }) {
  const providersResource = useResource(AuthProvidersList, AuthProvidersResource, resourceKeyList(providers));
  const translate = useTranslate();
  const style = useS(styles);
  const activeProviders = getComputed(() => user.authTokens.map(token => token.authProvider));

  return (
    <div className={s(style, { container: true }, className)}>
      <Loader state={providersResource}>
        {() => (
          <div className={s(style, { list: true })}>
            {providersResource.data.map(provider => {
              if (!provider) {
                return null;
              }

              const title = `${provider.label}\n${provider.description || ''}`;
              return (
                <Link key={provider.id} title={title} wrapper>
                  <Cell
                    className={s(style, { cell: true })}
                    before={provider.icon ? <IconOrImage className={s(style, { iconOrImage: true })} icon={provider.icon} /> : undefined}
                    after={
                      activeProviders.includes(provider.id) ? (
                        <div className={s(style, { providerLoginIcon: true })}>
                          <IconOrImage
                            className={s(style, { iconOrImage: true })}
                            icon="/icons/success_sm.svg"
                            title={translate('plugin_user_profile_auth_providers_active')}
                          />
                        </div>
                      ) : undefined
                    }
                    description={provider.description}
                  >
                    {provider.label}
                  </Cell>
                </Link>
              );
            })}
          </div>
        )}
      </Loader>
    </div>
  );
});
