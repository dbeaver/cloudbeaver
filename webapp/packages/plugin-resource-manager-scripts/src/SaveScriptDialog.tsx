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
import { RESOURCE_NAME_REGEX } from '@cloudbeaver/plugin-resource-manager';

const style = css`
  fill {
    flex: 1;
  }
`;

interface Payload {
  defaultScriptName?: string;
  projectId?: string | null;
}

export interface ISaveScriptDialogResult {
  name: string;
  projectId: string | null;
}

interface State extends ISaveScriptDialogResult {
  errorMessage: string | null;
  validate: () => void;
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
      errorMessage: null,
      validate() {
        this.errorMessage = null;

        const valid = RESOURCE_NAME_REGEX.test(this.name.trim());

        if (!valid) {
          this.errorMessage = translate('plugin_resource_manager_scripts_script_name_invalid_characters_message');
        }
      },
      async submit() {
        this.validate();

        if (!this.errorMessage) {
          resolveDialog(this);
        }
      },
    }),
    {
      name: observable.ref,
      projectId: observable.ref,
      errorMessage: observable.ref,
      validate: action.bound,
      submit: action.bound,
    },
    false,
  );

  return styled(
    style,
    BASE_CONTAINERS_STYLES,
  )(
    <CommonDialogWrapper size="small" className={className} fixedWidth>
      <CommonDialogHeader title={translate('plugin_resource_manager_scripts_save_script')} icon="/icons/sql_script_m.svg" onReject={rejectDialog} />
      <CommonDialogBody>
        <SubmittingForm ref={focusedRef} onSubmit={state.submit}>
          <Container center gap>
            <InputField name="name" state={state} error={!!state.errorMessage} description={state.errorMessage ?? undefined}>
              {translate('ui_name') + ':'}
            </InputField>
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
          </Container>
        </SubmittingForm>
      </CommonDialogBody>
      <CommonDialogFooter>
        <Button type="button" mod={['outlined']} onClick={rejectDialog}>
          <Translate token="ui_processing_cancel" />
        </Button>
        <fill />
        <Button type="button" mod={['unelevated']} disabled={!state.name.trim() || state.projectId === null} onClick={state.submit}>
          <Translate token="ui_processing_save" />
        </Button>
      </CommonDialogFooter>
    </CommonDialogWrapper>,
  );
});
