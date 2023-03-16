/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import styled, { css } from 'reshadow';

import { BASE_CONTAINERS_STYLES, Button, Container, InputField, SubmittingForm, Translate, useFocus, useObservableRef, useTranslate } from '@cloudbeaver/core-blocks';
import { CommonDialogBody, CommonDialogFooter, CommonDialogHeader, CommonDialogWrapper, DialogComponent } from '@cloudbeaver/core-dialogs';
import { throttleAsync } from '@cloudbeaver/core-utils';
import { ProjectSelect } from '@cloudbeaver/plugin-projects';

const style = css`
  CommonDialogFooter {
    align-items: center;
  }

  fill {
    flex: 1;
  }
`;

interface IFolderDialogState {
  value: string;
  projectId: string;
  message: string | undefined;
  valid: boolean;
  payload: FolderDialogPayload;
  validate: () => Promise<void>;
  setMessage: (message: string) => void;
  setProjectId: (projectId: string) => void;
}

export interface IFolderDialogResult {
  folder: string;
  projectId: string;
}

export interface FolderDialogPayload {
  value: string;
  projectId: string;
  selectProject: boolean;
  objectName?: string;
  icon?: string;
  subTitle?: string;
  bigIcon?: boolean;
  viewBox?: string;
  confirmActionText?: string;
  create?: boolean;
  title?: string;
  validation?: (result: IFolderDialogResult, setMessage: (message: string) => void) => Promise<boolean> | boolean;
}

export const FolderDialog: DialogComponent<FolderDialogPayload, IFolderDialogResult> = observer(function FolderDialog({
  payload,
  resolveDialog,
  rejectDialog,
  className,
}) {
  const translate = useTranslate();
  const [focusedRef] = useFocus<HTMLFormElement>({ focusFirstChild: true });

  const {
    icon,
    subTitle,
    bigIcon,
    viewBox,
    value,
    projectId,
    selectProject,
    objectName,
    create,
    confirmActionText,
  } = payload;
  let { title } = payload;

  if (!title) {
    title = create ? 'ui_create' : 'ui_rename';
  }

  title = translate(title);

  if (objectName) {
    title += ` ${translate(objectName)}`;
  }

  const state = useObservableRef<IFolderDialogState>(() => ({
    value,
    projectId,
    message: undefined,
    valid: true,
    validate: throttleAsync(async () => {
      state.message = undefined;
      state.valid = (await state.payload.validation?.(
        { folder:state.value, projectId: state.projectId },
        state.setMessage.bind(state)
      )) ?? true;
    }, 300),
    setMessage(message) {
      this.message = message;
    },
    setProjectId(projectId) {
      this.projectId = projectId;
    },
  }), {
    value: observable.ref,
    projectId: observable.ref,
    valid: observable.ref,
    message: observable.ref,
  }, {
    payload,
  });

  async function resolveHandler() {
    await state.validate();
    if (state.valid) {
      resolveDialog({ folder: state.value, projectId: state.projectId });
    }
  }

  useEffect(() => {
    state.validate();
  }, [state.value, state.projectId]);

  const errorMessage = state.valid ? ' ' : translate(state.message ?? 'ui_rename_taken_or_invalid');

  return styled(style, BASE_CONTAINERS_STYLES)(
    <CommonDialogWrapper size='small' className={className} fixedWidth>
      <CommonDialogHeader
        subTitle={subTitle}
        title={title}
        icon={icon}
        viewBox={viewBox}
        bigIcon={bigIcon}
        onReject={rejectDialog}
      />
      <CommonDialogBody>
        <SubmittingForm ref={focusedRef} onSubmit={resolveHandler}>
          <Container center gap>
            {selectProject && (
              <ProjectSelect
                value={state.projectId}
                onChange={projectId => state.setProjectId(projectId)}
              />
            )}
            <InputField
              name='value'
              state={state}
              error={!state.valid}
              description={errorMessage}
              onChange={() => state.validate()}
            >
              {translate('ui_name') + ':'}
            </InputField>
          </Container>
        </SubmittingForm>
      </CommonDialogBody>
      <CommonDialogFooter>
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
          disabled={!state.valid}
          onClick={resolveHandler}
        >
          <Translate token={confirmActionText || (create ? 'ui_create' : 'ui_rename')} />
        </Button>
      </CommonDialogFooter>
    </CommonDialogWrapper>
  );
});
