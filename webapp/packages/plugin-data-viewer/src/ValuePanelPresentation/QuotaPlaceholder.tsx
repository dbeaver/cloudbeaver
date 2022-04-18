/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { EAdminPermission } from '@cloudbeaver/core-administration';
import { Link } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import { usePermission } from '@cloudbeaver/core-root';

interface Props {
  limit?: string;
  size?: string;
  className?: string;
}

const style = css`
  container {
    margin: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
  }
  p {
    composes: theme-typography--body2 from global;
    text-align: center;
    margin: 0;
  }
  reason {
    display: flex;
    white-space: pre;
  }
  limit-word {
    text-transform: lowercase;
  }
`;

export const QuotaPlaceholder: React.FC<Props> = observer(function QuotaPlaceholder({
  limit,
  size,
  className,
  children,
}) {
  const translate = useTranslate();
  const admin = usePermission(EAdminPermission.admin);

  return styled(style)(
    <container className={className}>
      <p>
        {translate('data_viewer_presentation_value_content_was_truncated')}
        <reason>
          {translate('data_viewer_presentation_value_content_truncated_placeholder') + ' '}
          <limit-word>
            {admin ? (
              <Link href='https://cloudbeaver.io/docs/Server-configuration#resource-quotas' target='_blank' indicator>
                {translate('ui_limit')}
              </Link>
            ) : translate('ui_limit')}
          </limit-word>
        </reason>
        {limit && `${translate('ui_limit')}: ${limit}`}
        <br />
        {size && `${translate('data_viewer_presentation_value_content_value_size')}: ${size}`}
      </p>
      {children}
    </container>
  );
});