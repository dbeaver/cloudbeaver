/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { Button, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';

import { CreateUserService } from './CreateUserService.js';

export const CreateUserButton = observer(function CreateUserButton() {
  const translate = useTranslate();
  const createUserService = useService(CreateUserService);

  return (
    <Button
      variant="primary"
      className="tw:normal-case! tw:tracking-normal! tw:font-semibold"
      title={translate('authentication_administration_tools_add_tooltip')}
      disabled={!!createUserService.formState}
      onClick={createUserService.create}
    >
      {translate('authentication_administration_create_user')}
    </Button>
  );
});
