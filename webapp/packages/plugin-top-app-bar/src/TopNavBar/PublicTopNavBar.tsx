/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useService } from '@cloudbeaver/core-di';

import { TopNavBar } from './TopNavBar.js';
import { TopNavService } from './TopNavService.js';

interface Props {
  className?: string;
}

export const PublicTopNavBar: React.FC<Props> = function PublicTopNavBar({ className }) {
  const topNavService = useService(TopNavService);
  return <TopNavBar className={className} container={topNavService.placeholder} />;
};
