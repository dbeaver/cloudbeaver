/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Button } from '../Button/Button.js';
import { Input } from './Input.js';

export const InputExample = () => {
  return (
    <>
      <div>
        <Input placeholder="Username" />
        <Input placeholder="Password" type="password" />
        <Button>Log in</Button>
      </div>

      <div>
        <Input error="This user already exists" placeholder="Username" />
        <Input placeholder="Password" type="password" />
        <Button>Register</Button>
      </div>

      <div>
        <Input warning="This user already exists" placeholder="Username" />
        <Input placeholder="Password" type="password" />
        <Button>Register</Button>
      </div>

      <div>
        <Input error="This user already exists" placeholder="Username" />
        <Input placeholder="Password" type="password" />
        <Button>Register</Button>
      </div>
    </>
  );
};

export const InputWithWarning = () => {
  return <Input warning="This is a warning" />;
};
