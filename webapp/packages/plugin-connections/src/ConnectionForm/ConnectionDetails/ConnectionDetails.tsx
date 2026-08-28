/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useRef } from 'react';

import { Form, InputField, Placeholder, Textarea, useFormValidator, useResource, useTranslate } from '@cloudbeaver/core-blocks';
import { ConnectionInfoAuthPropertiesResource } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { FormMode, type TabContainerPanelComponent } from '@cloudbeaver/core-ui';
import { ProjectSelect } from '@cloudbeaver/plugin-projects';

import { ConnectionFormService } from '../ConnectionFormService.js';
import type { IConnectionFormProps } from '../IConnectionFormState.js';
import { ConnectionSectionWrapper } from '../ConnectionSectionWrapper.js';
import { PROFILE_AUTH_MODEL_ID } from '../PROFILE_AUTH_MODEL_ID.js';
import { ConnectionTypeForm } from '../Options/ConnectionTypeForm.js';
import { getConnectionFormOptionsPart } from '../Options/getConnectionFormOptionsPart.js';

export const ConnectionDetails: TabContainerPanelComponent<IConnectionFormProps> = observer(function ConnectionDetails({ formState }) {
  const formRef = useRef<HTMLFormElement>(null);
  const translate = useTranslate();
  const connectionFormService = useService(ConnectionFormService);
  const optionsPart = getConnectionFormOptionsPart(formState);
  const connectionInfoAuthResource = useResource(ConnectionDetails, ConnectionInfoAuthPropertiesResource, optionsPart.connectionKey);
  const readonly = formState.isDisabled || formState.isReadOnly || connectionInfoAuthResource.data?.authModel === PROFILE_AUTH_MODEL_ID;

  useFormValidator(formState.validationTask, formRef.current);

  function setProject(projectId: string) {
    formState.state.projectId = projectId;
  }

  return (
    <Form ref={formRef} className="tw:flex tw:flex-1 tw:overflow-auto">
      <ConnectionSectionWrapper>
        <section className="tw:flex tw:min-w-0 tw:flex-col tw:gap-4">
          <div className="tw:grid tw:grid-cols-1 tw:gap-4">
            <InputField type="text" name="name" minLength={1} state={optionsPart.state} readOnly={readonly} required fill>
              {translate('connections_connection_name')}
            </InputField>
            <ProjectSelect
              value={formState.state.projectId}
              readOnly={readonly || formState.mode === FormMode.Edit}
              disabled={formState.isDisabled}
              autoHide
              onChange={setProject}
            />
            <InputField type="text" name="folder" state={optionsPart.state} autoHide readOnly fill>
              {translate('plugin_connections_connection_form_part_main_folder')}
            </InputField>
          </div>
          <Textarea name="description" rows={3} state={optionsPart.state} readOnly={readonly}>
            {translate('connections_connection_description')}
          </Textarea>
        </section>

        <section className="theme-border-color-background tw:flex tw:min-w-0 tw:flex-col tw:gap-6 tw:border-t tw:pt-6">
          <ConnectionTypeForm config={optionsPart.state} />
          <Placeholder container={connectionFormService.connectionContainer} formState={formState} />
        </section>
      </ConnectionSectionWrapper>
    </Form>
  );
});
