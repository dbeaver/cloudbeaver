/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, observable } from 'mobx';
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

interface State {
  value: string;
  errorMessage: string | null;
  validate: () => void;
  submit: () => Promise<void>;
}

const regex = /^(?!\.)[\p{L}\w\-$.\s()@]+$/u;

export const SaveScriptDialog: DialogComponent<Payload, string> = observer(function SaveScriptDialog({
  payload,
  resolveDialog,
  rejectDialog,
  className,
}) {
  const translate = useTranslate();
  const [focusedRef] = useFocus<HTMLFormElement>({ focusFirstChild: true });

  const state = useObservableRef<State>(() => ({
    value: payload.defaultScriptName ?? '',
    errorMessage: null,
    validate() {
      this.errorMessage = null;

      const valid = regex.test(this.value.trim());

      if (!valid) {
        this.errorMessage = translate('plugin_resource_manager_script_name_invalid_characters_message');
      }
    },
    async submit() {
      this.validate();

      if (!this.errorMessage) {
        resolveDialog(this.value);
      }
    },
  }), {
    value: observable.ref,
    errorMessage: observable.ref,
    validate: action.bound,
    submit: action.bound,
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
            disabled={!state.value.trim()}
            onClick={state.submit}
          >
            <Translate token='ui_processing_save' />
          </Button>
        </>
      )}
      fixedWidth
      onReject={rejectDialog}
    >
      <SubmittingForm ref={focusedRef} onSubmit={state.submit}>
        <Container center>
          <InputField
            name='value'
            state={state}
            error={!!state.errorMessage}
            description={state.errorMessage ?? undefined}
          >
            {translate('ui_name') + ':'}
          </InputField>
        </Container>
      </SubmittingForm>
    </CommonDialogWrapper>
  );
});