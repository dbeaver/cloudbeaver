/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useState } from 'react';

import { useService } from '@cloudbeaver/core-di';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';
import { ErrorDetailsDialog } from '@cloudbeaver/core-notifications';

export function useErrorDetails(error: Error | null) {
  const commonDialogService = useService(CommonDialogService);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  let showErrorDetails;
  if (error) {
    showErrorDetails = async () => {
      try {
        setIsDialogOpen(true);
        await commonDialogService.open(ErrorDetailsDialog, error);
      } finally {
        setIsDialogOpen(false);
      }
    };
  }

  return { isDialogOpen, showErrorDetails };
}
