/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import { css } from 'reshadow';

import {
  Form,
  IconOrImage,
  Loader,
  Placeholder,
  s,
  useExecutor,
  useForm,
  useObjectRef,
  useS,
  useStyles,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import type { AdminAuthProviderConfiguration } from '@cloudbeaver/core-sdk';
import { BASE_TAB_STYLES, TabList, TabPanelList, TabsState, UNDERLINE_TAB_BIG_STYLES, UNDERLINE_TAB_STYLES } from '@cloudbeaver/core-ui';

import style from './AuthConfigurationForm.m.css';
import { AuthConfigurationFormService } from './AuthConfigurationFormService';
import { authConfigurationContext } from './Contexts/authConfigurationContext';
import type { IAuthConfigurationFormActions, IAuthConfigurationFormState } from './IAuthConfigurationFormProps';

const tabsStyles = css`
  TabList {
    position: relative;
    flex-shrink: 0;
    align-items: center;
  }
`;

interface Props {
  state: IAuthConfigurationFormState;
  onCancel?: () => void;
  onSave?: (configuration: AdminAuthProviderConfiguration) => void;
  className?: string;
}

export const AuthConfigurationForm = observer<Props>(function AuthConfigurationForm({ state, onCancel, onSave = () => {}, className }) {
  const translate = useTranslate();
  const props = useObjectRef({ onSave });
  const tabsInnerStyles = useStyles(BASE_TAB_STYLES, tabsStyles, UNDERLINE_TAB_STYLES, UNDERLINE_TAB_BIG_STYLES);
  const styles = useS(style);
  const service = useService(AuthConfigurationFormService);
  const form = useForm({
    onSubmit: async () => {
      await state.save();
    },
  });
  const actions = useObjectRef<IAuthConfigurationFormActions>({ save: form.submit });

  useExecutor({
    executor: state.submittingTask,
    postHandlers: [
      function save(data, contexts) {
        const validation = contexts.getContext(service.configurationValidationContext);
        const state = contexts.getContext(service.configurationStatusContext);
        const config = contexts.getContext(authConfigurationContext);

        if (validation.valid && state.saved) {
          props.onSave(config);
        }
      },
    ],
  });

  useEffect(() => {
    state.loadConfigurationInfo();
  }, []);

  return (
    <Form context={form}>
      <TabsState actions={actions} container={service.tabsContainer} state={state} onCancel={onCancel}>
        <div className={s(styles, { box: true }, className)}>
          <div className={s(styles, { topBar: true })}>
            <div className={s(styles, { topBarTabs: true })}>
              <div className={s(styles, { statusMessage: true })}>
                {state.statusMessage && (
                  <>
                    <IconOrImage className={s(styles, { iconOrImage: true })} icon="/icons/info_icon.svg" />
                    {translate(state.statusMessage)}
                  </>
                )}
              </div>
              <TabList style={tabsInnerStyles} disabled={false} />
            </div>
            <div className={s(styles, { topBarActions: true })}>
              <Loader suspense inline hideMessage hideException>
                <Placeholder actions={actions} container={service.actionsContainer} state={state} onCancel={onCancel} />
              </Loader>
            </div>
          </div>
          <div className={s(styles, { contentBox: true })}>
            <TabPanelList style={tabsInnerStyles} />
          </div>
        </div>
      </TabsState>
    </Form>
  );
});
