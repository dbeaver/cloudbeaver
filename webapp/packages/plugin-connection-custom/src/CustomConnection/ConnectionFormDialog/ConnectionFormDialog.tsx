/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import styled, { css } from 'reshadow';

import {
  SubmittingForm, TabsState, TabList, Loader, BORDER_TAB_STYLES, TabPanelList, useObjectRef
} from '@cloudbeaver/core-blocks';
import { DBDriver, IConnectionFormData, IConnectionFormOptions, ConnectionFormService, useConnectionFormState } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { CommonDialogWrapper } from '@cloudbeaver/core-dialogs';
import type { ConnectionConfig } from '@cloudbeaver/core-sdk';
import { useStyles, composes } from '@cloudbeaver/core-theming';
import { MetadataMap } from '@cloudbeaver/core-utils';

import { ConnectionFormDialogFooter } from './ConnectionFormDialogFooter';

const styles = composes(
  css`
    Tab {
      composes: theme-ripple theme-background-secondary theme-text-on-secondary from global;
    }
    ErrorMessage {
      composes: theme-background-secondary from global;
    }
  `,
  css`
    custom-connection {
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
    }
    CommonDialogWrapper {
      max-height: 610px;
      min-height: 610px;
    }
    SubmittingForm {
      flex: 1;
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    ErrorMessage {
      position: sticky;
      bottom: 0;
      padding: 8px 24px;
    }
  `
);

type ConnectionFormDialogProps = React.PropsWithChildren<{
  title: string;
  driver: DBDriver;
  onClose: () => void;
  onBack: () => void;
}>;

export const ConnectionFormDialog = observer(function ConnectionFormDialog({
  title,
  driver,
  onClose,
  onBack,
}: ConnectionFormDialogProps) {
  const props = useObjectRef({ onClose });
  const style = useStyles(styles, BORDER_TAB_STYLES);
  const service = useService(ConnectionFormService);

  const [data] = useState<IConnectionFormData>({
    config: observable<ConnectionConfig>({
      driverId: driver.id,
    }),
    availableDrivers: [driver.id],
    partsState: new MetadataMap<string, any>(),
  });

  const [options] = useState<IConnectionFormOptions>({
    mode: 'create',
    type: 'public',
  });

  const formState = useConnectionFormState(data, options);

  useEffect(() => {
    formState.submittingHandlers.addPostHandler((data, contexts) => {
      const validation = contexts.getContext(service.connectionStatusContext);

      if (validation.saved && data.submitType === 'submit') {
        props.onClose();
      }
    });
  }, []);

  return styled(style)(
    <TabsState
      container={service.tabsContainer}
      data={data}
      form={formState}
      options={options}
    >
      <CommonDialogWrapper
        title={title}
        icon={driver?.icon}
        header={<TabList style={style} />}
        footer={(
          <ConnectionFormDialogFooter
            isConnecting={formState.form.disabled}
            onConnectionTest={formState.test}
            onCreateConnection={formState.save}
            onBack={onBack}
          />
        )}
        noBodyPadding
        onReject={onClose}
      >
        <Loader loading={formState.form.loading}>
          {() => styled(style)(
            <SubmittingForm onSubmit={formState.save}>
              <TabPanelList style={style} />
            </SubmittingForm>
          )}
        </Loader>
        {/* {controller.error.responseMessage && (
          <ErrorMessage
            text={controller.error.responseMessage}
            hasDetails={controller.error.hasDetails}
            onShowDetails={controller.onShowDetails}
          />
        )} */}
      </CommonDialogWrapper>
    </TabsState>
  );
});
