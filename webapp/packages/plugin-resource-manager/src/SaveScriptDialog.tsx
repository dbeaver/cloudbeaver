/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { BASE_CONTAINERS_STYLES, Button, Container, InputField, SubmittingForm, useFocus, useObservableRef } from '@cloudbeaver/core-blocks';
import { CommonDialogWrapper, DialogComponent } from '@cloudbeaver/core-dialogs';
import { Translate, useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';

const style = css`
  fill {
    flex: 1;
  }
`;

interface Payload {
  defaultScriptName?: string;
}

export const SaveScriptDialog: DialogComponent<Payload, string> = observer(function SaveScriptDialog({
  payload,
  resolveDialog,
  rejectDialog,
  className,
}) {
  const translate = useTranslate();
  const [focusedRef] = useFocus<HTMLFormElement>({ focusFirstChild: true });

  const state = useObservableRef(() => ({
    value: payload.defaultScriptName,
  }), {
    value: observable.ref,
  }, false);

  return styled(useStyles(style, BASE_CONTAINERS_STYLES))(
    <CommonDialogWrapper
      size='small'
      title={translate('plugin_resource_manager_save_script')}
      icon='/icons/sql_script_m.svg'
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
            disabled={!state.value?.trim()}
            onClick={() => resolveDialog(state.value)}
          >
            <Translate token='ui_processing_save' />
          </Button>
        </>
      )}
      fixedWidth
      onReject={rejectDialog}
    >
      <SubmittingForm ref={focusedRef} onSubmit={() => resolveDialog(state.value)}>
        <Container center>
          <InputField name='value' state={state}>
            {translate('ui_name') + ':'}
          </InputField>
        </Container>
      </SubmittingForm>
    </CommonDialogWrapper>
  );
});