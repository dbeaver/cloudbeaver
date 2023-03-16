/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useState } from 'react';

import { useService } from '@cloudbeaver/core-di';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';
import { ErrorDetailsDialog } from '@cloudbeaver/core-notifications';
import { DetailsError } from '@cloudbeaver/core-sdk';
import { errorOf, LoadingError } from '@cloudbeaver/core-utils';

interface IErrorDetailsHook {
  name?: string;
  message?: string;
  error: Error | null;
  details?: DetailsError;
  hasDetails: boolean;
  isOpen: boolean;
  open: () => void;
  refresh?: () => void;
}

type HookType = IErrorDetailsHook | ({
  name: string;
  error: Error;
} & IErrorDetailsHook);

export function useErrorDetails(error: Error | null): HookType {
  const service = useService(CommonDialogService);
  const [isOpen, setIsOpen] = useState(false);
  const details = errorOf(error, DetailsError);
  const loadingError = errorOf(error, LoadingError);

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
  const name = error?.name;
  const message = error?.message;

  return {
    name,
    message,
    error,
    details,
    hasDetails: details?.hasDetails() ?? false,
    isOpen,
    open,
    refresh: loadingError?.refresh,
  };
}
