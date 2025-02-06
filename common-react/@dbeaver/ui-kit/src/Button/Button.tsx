/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Button as AriaButton, type ButtonProps } from "@ariakit/react";
import "./Button.css";

interface UiKitButtonProps extends ButtonProps {
  variant?: "primary" | "secondary";
}

export function Button({className, variant = "primary", ...props}: UiKitButtonProps) {
  const classToApply = `btn-${variant}`;

  return <AriaButton className={className ?? '' + ' ' + classToApply} {...props} />;
}
