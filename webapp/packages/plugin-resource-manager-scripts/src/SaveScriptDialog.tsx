/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import {
  BASE_CONTAINERS_STYLES,
  Button,
  Container,
  InputField,
  SubmittingForm,
  Translate,
  useFocus,
  useObservableRef,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { CommonDialogBody, CommonDialogFooter, CommonDialogHeader, CommonDialogWrapper, DialogComponent } from '@cloudbeaver/core-dialogs';
import { ProjectSelect } from '@cloudbeaver/plugin-projects';

const style = css`
  fill {
    flex: 1;
  }
`;

export interface ISaveScriptDialogResult {
  name: string;
  projectId: string | null;
}

interface Payload {
  defaultScriptName?: string;
  projectId?: string | null;
  validation?: (result: ISaveScriptDialogResult, setMessage: (message: string) => void) => Promise<boolean> | boolean;
}

interface State extends ISaveScriptDialogResult {
  message: string | null;
  valid: boolean;
  validate: () => Promise<void>;
  submit: () => Promise<void>;
}

export const SaveScriptDialog: DialogComponent<Payload, ISaveScriptDialogResult> = observer(function SaveScriptDialog({
  payload,
  resolveDialog,
  rejectDialog,
  className,
}) {
  const translate = useTranslate();
  const [focusedRef] = useFocus<HTMLFormElement>({ focusFirstChild: true });

  const state = useObservableRef<State>(
    () => ({
      name: payload.defaultScriptName ?? '',
      projectId: payload.projectId ?? null,
      message: null,
      valid: true,
      async validate() {
        this.message = null;

        let valid: boolean | undefined;

        try {
          valid = await payload.validation?.({ name: this.name, projectId: this.projectId }, (message: string) => {
            this.message = message;
          });
        } catch {}

        this.valid = valid ?? true;
      },
      async submit() {
        await this.validate();

        if (state.valid) {
          resolveDialog(this);
        }
      },
    }),
    {
      name: observable.ref,
      projectId: observable.ref,
      message: observable.ref,
      valid: observable.ref,
      submit: action.bound,
      validate: action.bound,
    },
    false,
  );

  const errorMessage = state.valid ? ' ' : translate(state.message ?? 'ui_rename_taken_or_invalid');

  return styled(
    style,
    BASE_CONTAINERS_STYLES,
  )(
    <CommonDialogWrapper size="small" className={className} fixedWidth>
      <CommonDialogHeader title={translate('plugin_resource_manager_scripts_save_script')} icon="/icons/sql_script_m.svg" onReject={rejectDialog} />
      <CommonDialogBody>
        <SubmittingForm ref={focusedRef} onSubmit={state.submit}>
          <Container center gap>
            <ProjectSelect
              value={state.projectId}
              filter={p => p.canEditResources && p.id === (payload.projectId ?? p.id)}
              descriptionGetter={(_, options) =>
                options.length <= 1 ? translate('plugin_resource_manager_scripts_save_script_project_restriction_descripion') : undefined
              }
              autoHide
              onChange={projectId => {
                state.projectId = projectId;
              }}
            />
            <InputField
              name="name"
              state={state}
              error={!state.valid}
              disabled={state.projectId === null}
              description={errorMessage}
              onChange={state.validate}
            >
              {translate('ui_name') + ':'}
            </InputField>
          </Container>
        </SubmittingForm>
      </CommonDialogBody>
      <CommonDialogFooter>
        <Button type="button" mod={['outlined']} onClick={rejectDialog}>
          <Translate token="ui_processing_cancel" />
        </Button>
        <fill />
        <Button type="button" mod={['unelevated']} disabled={!state.valid} onClick={state.submit}>
          <Translate token="ui_processing_save" />
        </Button>
      </CommonDialogFooter>
    </CommonDialogWrapper>,
  );
});
