/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { AUTH_PROVIDER_LOCAL_ID, UsersResource } from '@cloudbeaver/core-authentication';
import { Icon, PlaceholderComponent, s, StaticImage, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CommonDialogService, ConfirmationDialog, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import type { ObjectOrigin } from '@cloudbeaver/core-sdk';

import type { IUserDetailsInfoProps } from '../../UsersAdministrationService';
import style from './Origin.m.css';

const USER_DETAILS_STYLES = css`
  StaticImage {
    width: 24px;
    height: 24px;
  }
`;

interface IOriginIconProps {
  origin: ObjectOrigin;
  className?: string;
}

export const OriginIcon = observer<IOriginIconProps>(function Origin({ origin, className }) {
  const translate = useTranslate();

  const isLocal = origin.type === AUTH_PROVIDER_LOCAL_ID;
  const icon = isLocal ? '/icons/local_connection.svg' : origin.icon;
  const title = isLocal ? translate('authentication_administration_user_local') : origin.displayName;

  return styled(USER_DETAILS_STYLES)(<StaticImage key={origin.type + origin.subType} icon={icon} title={title} className={className} />);
});

export const Origin: PlaceholderComponent<IUserDetailsInfoProps> = observer(function Origin({ user }) {
  const translate = useTranslate();
  const usersResource = useService(UsersResource);
  const commonDialogService = useService(CommonDialogService);
  const notificationService = useService(NotificationService);

  const styles = useS(style);

  async function onDelete(originId: string, originName: string) {
    const state = await commonDialogService.open(ConfirmationDialog, {
      title: 'ui_data_delete_confirmation',
      message: translate('authentication_administration_user_remove_credentials_confirmation_message', undefined, {
        originName,
        userId: user.userId,
      }),
      confirmActionText: 'ui_delete',
    });

    if (state !== DialogueStateResult.Rejected) {
      try {
        await usersResource.deleteCredentials(user.userId, originId);
        notificationService.logSuccess({ title: 'authentication_administration_user_remove_credentials_success' });
      } catch (exception: any) {
        notificationService.logException(exception, 'authentication_administration_user_remove_credentials_error');
      }
    }
  }

  return (
    <>
      {user.origins.map(origin => (
        <div
          key={origin.type + origin.subType}
          title={origin.displayName}
          className={s(styles, { container: true })}
          onClick={() => onDelete(origin.type, origin.displayName)}
        >
          <OriginIcon className={s(styles, { originIcon: true })} origin={origin} />
          <Icon className={s(styles, { icon: true })} name="reject" viewBox="0 0 16 16" />
        </div>
      ))}
    </>
  );
});
