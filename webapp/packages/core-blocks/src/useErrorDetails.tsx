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

interface IErrorDetails{
  isOpen: boolean;
  open: () => void;
}

export function useErrorDetails(error: Error | null): IErrorDetails {
  const service = useService(CommonDialogService);
  const [isOpen, setIsOpen] = useState(false);

  const open = async () => {
    if (!error) {
      return;
    }
    try {
      setIsOpen(true);
      await service.open(ErrorDetailsDialog, error);
    } finally {
      setIsOpen(false);
    }
  };

  return { isOpen, open };
}
