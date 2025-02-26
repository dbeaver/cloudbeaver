/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Button } from '../../../Button/Button.js';
import { Input } from '../../../Input/Input.js';

export const InputExample = () => {
  return (
    <>
      <div>
        <Input placeholder="Username" />
        <Input placeholder="Password" type="password" />
        <Button>Log in</Button>
      </div>
    </>
  );
};
