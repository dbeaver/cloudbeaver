import { useState } from 'react';

import { useService } from '@cloudbeaver/core-di';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';
import { ErrorDetailsDialog } from '@cloudbeaver/core-notifications';

interface IUseErrorDetailsProps {
  error: Error | null;
}
export function useErrorDetails({ error }: IUseErrorDetailsProps) {
  const commonDialogService = useService(CommonDialogService);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  let onShowDetailsError;
  if (error) {
    onShowDetailsError = async () => {
      if (!error) {
        return;
      }
      try {
        setIsDialogOpen(true);
        await commonDialogService.open(ErrorDetailsDialog, error);
      } finally {
        setIsDialogOpen(false);
      }
    };
  }

  return { isDialogOpen, onShowDetailsError };
}
