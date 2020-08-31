/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import { useContext, useCallback } from 'react';

import {
  TableContext,
} from '@cloudbeaver/core-blocks';

import { UserForm } from '../UserForm/UserForm';

type Props = {
  item: string;
}

export const UserEdit = observer(function UserEdit({
  item,
}: Props) {
  const tableContext = useContext(TableContext);
  const collapse = useCallback(() => tableContext?.setItemExpand(item, false), [tableContext]);

  return <UserForm userId={item} onCancel={collapse} />;
});
