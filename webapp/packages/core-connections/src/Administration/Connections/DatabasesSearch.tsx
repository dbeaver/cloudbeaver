/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled, { css } from 'reshadow';

import { Button, InputField, SubmittingForm } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles, composes } from '@cloudbeaver/core-theming';

const styles = composes(
  css`
    SubmittingForm {
      composes: theme-border-color-background from global;
    }
  `,
  css`
    SubmittingForm {
      flex: 1;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      border-top: solid 1px;
    }

    group {
      box-sizing: border-box;
      display: flex;
    }

    action {
      padding-left: 24px;
    }

    InputField {
      width: 450px;
    }
  `
);

type Props = {
  hosts: string;
  className?: string;
  onChange(hosts: string): void;
  onSearch(): void;
  disabled?: boolean;
}

export const DatabasesSearch = observer(function DatabasesSearch({
  hosts,
  className,
  onChange,
  onSearch,
  disabled,
}: Props) {
  const translate = useTranslate();

  return styled(useStyles(styles))(
    <SubmittingForm onSubmit={onSearch} className={className}>
      <group as="div">
        <InputField
          name="hosts"
          value={hosts}
          placeholder='localhost 127.0.0.1'
          onChange={onChange}
          disabled={disabled}
          mod='surface'
        >
          {translate('connections_connection_edit_search_hosts')}
        </InputField>
      </group>
      <action as='div'>
        <Button
          type="submit"
          disabled={disabled}
          mod={['outlined']}
          onClick={onSearch}
        >
          {translate('connections_connection_edit_search')}
        </Button>
      </action>
    </SubmittingForm>
  );
});
