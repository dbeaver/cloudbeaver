/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';

import {
  Button,
  CommonDialogBody,
  CommonDialogFooter,
  CommonDialogHeader,
  CommonDialogWrapper,
  Container,
  Fill,
  Form,
  InputField,
  s,
  Translate,
  useFocus,
  useObservableRef,
  useResource,
  useS,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import type { DialogComponent } from '@cloudbeaver/core-dialogs';
import { type ProjectInfo, ProjectInfoResource } from '@cloudbeaver/core-projects';
import { createPath, throttleAsync } from '@cloudbeaver/core-utils';

import style from './FolderDialog.module.css';
import { ProjectSelect } from './ProjectSelect.js';

interface IFolderDialogState {
  value: string;
  projectId: string;
  folder?: string;
  message: string | undefined;
  valid: boolean;
  payload: FolderDialogPayload;
  validationInProgress: boolean;
  validate: () => Promise<void>;
  setMessage: (message: string) => void;
  setProjectId: (projectId: string) => void;
}

export interface IFolderDialogResult {
  folder?: string;
  name: string;
  projectId: string;
}

export interface FolderDialogPayload {
  value: string;
  projectId: string;
  folder?: string;

  selectProject: boolean;
  objectName?: string;
  icon?: string;
  bigIcon?: boolean;
  viewBox?: string;
  confirmActionText?: string;
  create?: boolean;
  title?: string;
  validation?: (result: IFolderDialogResult, setMessage: (message: string) => void) => Promise<boolean> | boolean;
  filterProject?: (project: ProjectInfo) => boolean;
}

export const FolderDialog: DialogComponent<FolderDialogPayload, IFolderDialogResult> = observer(function FolderDialog({
  payload,
  resolveDialog,
  rejectDialog,
  className,
}) {
  const styles = useS(style);
  const translate = useTranslate();
  const [focusedRef] = useFocus<HTMLFormElement>({ focusFirstChild: true });

  const { icon, folder, bigIcon, viewBox, value, projectId, selectProject, objectName, create, confirmActionText, filterProject } = payload;
  let { title } = payload;

  if (!title) {
    title = create ? 'ui_create' : 'ui_rename';
  }

  title = translate(title);

  if (objectName) {
    title += ` ${translate(objectName)}`;
  }

  const state = useObservableRef<IFolderDialogState>(
    () => ({
      value,
      projectId,
      folder,
      message: undefined,
      valid: true,
      validationInProgress: false,
      validate: throttleAsync(async () => {
        const { folder, value, projectId } = state;
        state.message = undefined;
        state.validationInProgress = true;
        let valid: boolean | undefined;
        try {
          valid = await state.payload.validation?.({ folder, name: value, projectId }, (message: string) => {
            if (state.folder === folder && state.value === value && state.projectId === projectId) {
              state.setMessage(message);
            }
          });
        } catch (exception: any) {
          valid = false;
          state.setMessage(exception.message);
        }

        if (state.folder === folder && state.value === value && state.projectId === projectId) {
          state.valid = valid ?? true;
          state.validationInProgress = false;
        }
      }, 300),
      setMessage(message) {
        this.message = message;
      },
      setProjectId(projectId) {
        this.projectId = projectId;
        this.folder = undefined;
      },
    }),
    {
      value: observable.ref,
      projectId: observable.ref,
      validationInProgress: observable.ref,
      folder: observable.ref,
      valid: observable.ref,
      message: observable.ref,
    },
    {
      payload,
    },
  );

  const projectInfoLoader = useResource(FolderDialog, ProjectInfoResource, state.projectId);

  async function resolveHandler() {
    try {
      await state.validate();
      if (state.valid) {
        resolveDialog({ folder: state.folder, name: state.value, projectId: state.projectId });
      }
    } catch {}
  }

  useEffect(() => {
    state.validate().catch(() => {});
  }, [state.value, state.projectId]);

  const errorMessage = state.valid ? ' ' : translate(state.message ?? 'ui_rename_taken_or_invalid');
  const subTitle = createPath(projectInfoLoader.data?.name ?? state.projectId, state.folder);

  return (
    <CommonDialogWrapper size="small" className={className} fixedWidth>
      <CommonDialogHeader subTitle={subTitle} title={title} icon={icon} viewBox={viewBox} bigIcon={bigIcon} onReject={rejectDialog} />
      <CommonDialogBody>
        <Form ref={focusedRef} onSubmit={resolveHandler}>
          <Container center gap>
            {selectProject && <ProjectSelect value={state.projectId} filter={filterProject} onChange={projectId => state.setProjectId(projectId)} />}
            <InputField
              name="value"
              state={state}
              error={!state.valid}
              description={errorMessage}
              loading={state.validationInProgress}
              onChange={() => state.validate().catch(() => {})}
            >
              {translate('ui_name')}
            </InputField>
          </Container>
        </Form>
      </CommonDialogBody>
      <CommonDialogFooter className={s(styles, { footer: true })}>
        <Button type="button" variant="secondary" onClick={rejectDialog}>
          <Translate token="ui_processing_cancel" />
        </Button>
        <Fill />
        <Button type="button" disabled={!state.valid} onClick={resolveHandler}>
          <Translate token={confirmActionText || (create ? 'ui_create' : 'ui_rename')} />
        </Button>
      </CommonDialogFooter>
    </CommonDialogWrapper>
  );
});
