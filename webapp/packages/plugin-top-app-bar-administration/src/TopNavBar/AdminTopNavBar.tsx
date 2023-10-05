/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useService } from '@cloudbeaver/core-di';
import { AdministrationTopAppBarService } from '@cloudbeaver/plugin-administration';
import { TopNavBar } from '@cloudbeaver/plugin-top-app-bar';

interface Props {
  className?: string;
}
export const AdminTopNavBar: React.FC<Props> = function PublicTopNavBar({ className }) {
  const administrationTopAppBarService = useService(AdministrationTopAppBarService);
  return <TopNavBar className={className} container={administrationTopAppBarService.placeholder} />;
};
