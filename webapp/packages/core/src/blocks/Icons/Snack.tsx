/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { SVGAttributes } from 'react';

export function Snack(props: SVGAttributes<any>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="10"
      viewBox="0 0 16 10"
      {...props}
    >
      <path
        d="M0 8.464h16v1H0zm0-4.038h16v1H0zM0 .387h16v1H0z"
        fill="#338ECC"
        fillRule="evenodd"
        className="icon-fill"
      />
    </svg>
  );
}
