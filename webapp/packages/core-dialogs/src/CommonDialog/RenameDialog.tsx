/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useState } from 'react';
import styled, { css } from 'reshadow';

import { BASE_CONTAINERS_STYLES, Button, Container, InputField, SubmittingForm, useFocus } from '@cloudbeaver/core-blocks';
import { Translate, useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';

import { CommonDialogWrapper } from './CommonDialog/CommonDialogWrapper';
import type { DialogComponent } from './CommonDialogService';

const style = css`
  footer {
    align-items: center;
  }

  fill {
    flex: 1;
  }
`;

export interface RenameDialogPayload {
  value: string;
  objectName: string;
  icon?: string;
  subTitle?: string;
  bigIcon?: boolean;
  viewBox?: string;
  confirmActionText?: string;
}

export const RenameDialog: DialogComponent<RenameDialogPayload, string> = function RenameDialog({
  payload,
  resolveDialog,
  rejectDialog,
  className,
}) {
  const translate = useTranslate();
  const [focusedRef] = useFocus<HTMLFormElement>({ focusFirstChild: true });

  const { icon, subTitle, bigIcon, viewBox, value, objectName, confirmActionText } = payload;
  const title = `${translate('ui_rename')} ${objectName}`;

  const [name, setName] = useState(value);

  return styled(useStyles(style, BASE_CONTAINERS_STYLES))(
    <CommonDialogWrapper
      size='small'
      subTitle={subTitle}
      title={title}
      icon={icon}
      viewBox={viewBox}
      bigIcon={bigIcon}
      className={className}
      style={style}
      footer={(
        <>
          <Button
            type="button"
            mod={['outlined']}
            onClick={rejectDialog}
          >
            <Translate token='ui_processing_cancel' />
          </Button>
          <fill />
          <Button
            type="button"
            mod={['unelevated']}
            onClick={() => resolveDialog(name)}
          >
            <Translate token={confirmActionText || 'ui_rename'} />
          </Button>
        </>
      )}
      fixedWidth
      onReject={rejectDialog}
    >
      <SubmittingForm ref={focusedRef} onSubmit={() => resolveDialog(name)}>
        <Container center>
          <InputField
            value={name}
            onChange={value => setName(String(value))}
          >
            {translate('ui_name') + ':'}
          </InputField>
        </Container>
      </SubmittingForm>
    </CommonDialogWrapper>
  );
};
