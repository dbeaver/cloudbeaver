/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Textarea } from '@cloudbeaver/core-blocks';

interface UrlConfirmationDetailsProps {
  url: string;
}

const UrlConfirmationDetails = ({ url }: UrlConfirmationDetailsProps) => (
  <div className="tw:mt-4">
    <Textarea value={url} rows={6} readOnly />
  </div>
);

export function renderUrlConfirmationDetails(url: string): React.ReactElement {
  return <UrlConfirmationDetails url={url} />;
}
