/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Container, Link, s, usePermission, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { EAdminPermission } from '@cloudbeaver/core-root';

import styles from './QuotaPlaceholder.m.css';

interface Props {
  limit?: string;
  className?: string;
}

export const QuotaPlaceholder: React.FC<React.PropsWithChildren<Props>> = observer(function QuotaPlaceholder({ limit, className, children }) {
  const translate = useTranslate();
  const admin = usePermission(EAdminPermission.admin);
  const style = useS(styles);

  return (
    <Container className={className} vertical center>
      <Container center vertical>
        {translate('data_viewer_presentation_value_content_was_truncated')}
        <Container noWrap center>
          <Container>{translate('data_viewer_presentation_value_content_truncated_placeholder')}</Container>
          <Container className={s(style, { limitWord: true })} zeroBasis>
            {admin ? (
              <Link
                className={s(style, { link: true })}
                title={limit}
                href="https://dbeaver.com/docs/cloudbeaver/Server-configuration/#resource-quotas"
                target="_blank"
                indicator
              >
                {translate('ui_limit')}
              </Link>
            ) : (
              translate('ui_limit')
            )}
          </Container>
        </Container>
      </Container>
      <Container>{children}</Container>
    </Container>
  );
});
