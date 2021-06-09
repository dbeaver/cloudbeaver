/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { TableColumnHeader, TableHeader } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';

interface Props {
  className?: string;
}

export const ConnectionAccessTableInnerHeader: React.FC<Props> = observer(function ConnectionAccessTableInnerHeader({ className }) {
  const translate = useTranslate();
  return (
    <TableHeader className={className}>
      <TableColumnHeader min />
      <TableColumnHeader min />
      <TableColumnHeader>{translate('connections_connection_access_user_or_role_name')}</TableColumnHeader>
      <TableColumnHeader>{translate('connections_connection_description')}</TableColumnHeader>
    </TableHeader>
  );
});
