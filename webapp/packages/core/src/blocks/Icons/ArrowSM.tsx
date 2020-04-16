/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export function ArrowSM({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      className={className}
    >
      <path
        fillRule="evenodd"
        stroke="none"
        strokeWidth="1"
        d="M9.46 6.316l.7 3.675a1 1 0 01-1.17 1.17l-3.674-.702a1 1 0 01-.52-1.689L7.77 5.796a1 1 0 011.69.52z"
        className="icon-fill"
        transform="rotate(-45 7.243 8.243)"
      />
    </svg>
  );
}
