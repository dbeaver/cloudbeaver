/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import type { DialogComponentProps } from '@cloudbeaver/core-dialogs';
import type { TLocalizationToken } from '@cloudbeaver/core-localization';

import { Button } from '../Button.js';
import { CommonDialogBody } from '../CommonDialog/CommonDialog/CommonDialogBody.js';
import { CommonDialogFooter } from '../CommonDialog/CommonDialog/CommonDialogFooter.js';
import { CommonDialogHeader } from '../CommonDialog/CommonDialog/CommonDialogHeader.js';
import { CommonDialogWrapper } from '../CommonDialog/CommonDialog/CommonDialogWrapper.js';
import { Container } from '../Containers/Container.js';
import { Fill } from '../Fill.js';
import { IconOrImage } from '../IconOrImage.js';
import { Translate } from '../localization/Translate.js';
import { useTranslate } from '../localization/useTranslate.js';
import { Tag } from '../Tags/Tag.js';
import { Tags } from '../Tags/Tags.js';
import type { IExportFilterEntry } from './IExportFilterEntry.js';

export interface IExportConfirmationDialogState {
  filters: IExportFilterEntry[];
}

export interface IExportConfirmationDialogPayload {
  state: IExportConfirmationDialogState;
  confirmTitle: TLocalizationToken;
  descriptionWithFilters: TLocalizationToken;
  descriptionDefault: TLocalizationToken;
  hint: TLocalizationToken;
  openOptionsLabel: TLocalizationToken;
  showHint?: boolean;
  onOpenOptions?: () => void;
}

export const ExportConfirmationDialog = observer<DialogComponentProps<IExportConfirmationDialogPayload>>(function ExportConfirmationDialog({
  payload,
  resolveDialog,
  rejectDialog,
  className,
}) {
  const translate = useTranslate();
  const { state, confirmTitle, descriptionWithFilters, descriptionDefault, hint, openOptionsLabel, showHint, onOpenOptions } = payload;
  const hasFilters = state.filters.length > 0;

  return (
    <CommonDialogWrapper size="medium" className={className} fixedWidth>
      <CommonDialogHeader title={confirmTitle} onReject={() => rejectDialog()} />
      <CommonDialogBody>
        <>
          <div className="tw:mb-3">
            <Translate token={hasFilters ? descriptionWithFilters : descriptionDefault} />
          </div>
          {hasFilters && (
            <ul className="tw:flex tw:flex-col tw:gap-1 tw:mb-3">
              {state.filters.map(f => (
                <li key={f.key} className="tw:flex tw:items-start tw:gap-1">
                  <strong className="tw:shrink-0">{translate(f.label)}:</strong>{' '}
                  {f.items ? (
                    <Tags className="tw:inline-flex tw:align-middle">
                      {f.items.map(item => (
                        <Tag key={String(item.id)} id={item.id} label={item.label} icon={item.icon} />
                      ))}
                    </Tags>
                  ) : (
                    f.value
                  )}
                </li>
              ))}
            </ul>
          )}
          {hasFilters && showHint && (
            <div className="tw:flex tw:items-start tw:gap-2 tw:bg-(--theme-secondary) tw:p-3 tw:rounded tw:mt-auto">
              <IconOrImage className="tw:py-1 tw:px-0.5" icon="/icons/preload/info_icon_sm.svg" />
              <span className="tw:text-pretty">{translate(hint)}</span>
            </div>
          )}
        </>
      </CommonDialogBody>
      <CommonDialogFooter>
        {onOpenOptions && (
          <Container keepSize>
            <Button variant="secondary" onClick={onOpenOptions}>
              {translate(openOptionsLabel)}
            </Button>
          </Container>
        )}
        <Fill />
        <Container keepSize noWrap gap>
          <Button variant="secondary" onClick={() => rejectDialog()}>
            {translate('ui_processing_cancel')}
          </Button>
          <Button onClick={() => resolveDialog()}>{translate('ui_export')}</Button>
        </Container>
      </CommonDialogFooter>
    </CommonDialogWrapper>
  );
});
