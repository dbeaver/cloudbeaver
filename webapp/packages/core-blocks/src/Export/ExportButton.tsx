/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable } from 'mobx';
import { observer } from 'mobx-react-lite';

import { useService } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import type { TLocalizationToken } from '@cloudbeaver/core-localization';

import { Icon } from '../Icon.js';
import { useTranslate } from '../localization/useTranslate.js';
import { useObservableRef } from '../useObservableRef.js';
import { ExportConfirmationDialog, type IExportConfirmationDialogState } from './ExportConfirmationDialog.js';
import { GridAction } from './GridAction.js';
import type { IExportFilterEntry } from './IExportFilterEntry.js';

export interface IExportButtonProps {
  filters?: IExportFilterEntry[];
  title?: TLocalizationToken;
  confirmTitle?: TLocalizationToken;
  descriptionWithFilters?: TLocalizationToken;
  descriptionDefault?: TLocalizationToken;
  /** Hint shown in the info box when `showHint` is enabled */
  hint?: TLocalizationToken;
  openOptionsLabel?: TLocalizationToken;
  showHint?: boolean;
  exportHandler: () => void;
  onOpenOptions?: () => void;
}

export const ExportButton = observer<IExportButtonProps>(function ExportButton({
  filters,
  title = 'core_blocks_export_title',
  confirmTitle = 'core_blocks_export_confirm_title',
  descriptionWithFilters = 'core_blocks_export_confirm_with_filters',
  descriptionDefault = 'core_blocks_export_confirm_default',
  hint = 'core_blocks_export_confirm_default',
  openOptionsLabel = 'core_blocks_export_change_filters',
  showHint,
  exportHandler,
  onOpenOptions,
}) {
  const translate = useTranslate();
  const commonDialogService = useService(CommonDialogService);

  const dialogState = useObservableRef<IExportConfirmationDialogState>(
    () => ({ filters: filters ?? [] }),
    { filters: observable.ref },
    { filters: filters ?? [] },
  );

  async function handleExport() {
    const { status } = await commonDialogService.open(ExportConfirmationDialog, {
      state: dialogState,
      confirmTitle,
      descriptionWithFilters,
      descriptionDefault,
      hint,
      openOptionsLabel,
      showHint,
      onOpenOptions,
    });

    if (status !== DialogueStateResult.Resolved) {
      return;
    }

    exportHandler();
  }

  return (
    <GridAction title={translate(title)} onClick={handleExport}>
      <Icon className="tw:w-full tw:h-full tw:fill-(--theme-primary)" name="table-export" viewBox="0 0 24 24" />
    </GridAction>
  );
});
