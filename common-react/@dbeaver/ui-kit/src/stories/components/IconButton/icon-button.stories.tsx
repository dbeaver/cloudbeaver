import { useState } from 'react';
import { IconButton } from '../../../index.js';

const example = `<IconButton 
    variant="primary" | "secondary" | "danger"
    size="small" | "medium" | "large" | "xlarge"
    loading={boolean}
    disabled={boolean}
    onClick={function}
    aria-label="string"
>
    {icon}
</IconButton>`;

export const Documentation = () => {
  return (
    <div className="tw:space-y-4">
      <h1 className="tw:text-2xl tw:font-bold">IconButton</h1>
      <p>IconButton is a button component that displays an icon. It supports various sizes and styles, and can be disabled or in a loading state.</p>

      <pre className="codeblock">{example}</pre>

      <h2 className="tw:text-xl tw:font-semibold">Classnames</h2>
      <ul className="tw:list-disc tw:pl-5">
        <li>
          <code>dbv-kit-icon-button</code> - Main component class
        </li>
        <li>
          <code>dbv-kit-icon-button--primary/secondary/danger</code> - Variant classes
        </li>
        <li>
          <code>dbv-kit-icon-button--small/medium/large/xlarge</code> - Size classes
        </li>
      </ul>

      <h2 className="tw:text-xl tw:font-semibold">CSS Tokens</h2>
      <div className="tw:p-4 tw:rounded-md tw:overflow-auto">
        <h3 className="tw:font-medium">Structure</h3>
        <ul className="tw:pl-5 tw:mb-2">
          <li>
            <code>--dbv-kit-icon-btn-border-radius</code> - Controls button corner roundness
          </li>
          <li>
            <code>--dbv-kit-icon-btn-border-width/style/color</code> - Border properties
          </li>
          <li>
            <code>--dbv-kit-icon-btn-size</code> - Default button size (medium)
          </li>
        </ul>

        <h3 className="tw:font-medium">Focus State</h3>
        <ul className="tw:pl-5 tw:mb-2">
          <li>
            <code>--dbv-kit-icon-btn-outline-color/offset</code> - Focus outline appearance
          </li>
        </ul>

        <h3 className="tw:font-medium">Colors</h3>
        <ul className="tw:pl-5">
          <li>
            <code>--dbv-kit-icon-btn-foreground/background</code> - Default state colors
          </li>
          <li>
            <code>--dbv-kit-icon-btn-foreground/background-hover</code> - Hover state colors
          </li>
          <li>
            <code>--dbv-kit-icon-btn-foreground/background-active</code> - Active state colors
          </li>
          <li>
            <code>--dbv-kit-btn-loader-color/base-color</code> - Loading spinner colors
          </li>
        </ul>
      </div>
    </div>
  );
};

export const IconButtons = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 5000);
  };

  return (
    <div className="tw:flex tw:flex-col tw:gap-4 tw:my-4 tw:items-center">
      <div>
        <h2>Primary</h2>
        <div className="tw:flex tw:gap-4 tw:my-4 tw:items-center">
          <IconButton variant="primary" size="small" aria-label="Add item">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="6" fill="currentColor" />
            </svg>
          </IconButton>
          <IconButton variant="primary" size="medium" aria-label="Add item">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="6" fill="currentColor" />
            </svg>
          </IconButton>
          <IconButton variant="primary" size="large" aria-label="Add item">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="6" fill="currentColor" />
            </svg>
          </IconButton>
          <IconButton variant="primary" size="xlarge" aria-label="Add item">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="6" fill="currentColor" />
            </svg>
          </IconButton>
        </div>
      </div>
      <div>
        <h2>Secondary</h2>
        <div className="tw:flex tw:gap-4 tw:my-4 tw:items-center">
          <IconButton variant="secondary" size="small" aria-label="Add item">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="6" fill="currentColor" />
            </svg>
          </IconButton>
          <IconButton variant="secondary" size="medium" aria-label="Add item">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="6" fill="currentColor" />
            </svg>
          </IconButton>
          <IconButton variant="secondary" size="large" aria-label="Add item">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="6" fill="currentColor" />
            </svg>
          </IconButton>
          <IconButton variant="secondary" size="xlarge" aria-label="Add item">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="6" fill="currentColor" />
            </svg>
          </IconButton>
        </div>
      </div>
      <div>
        <h2>Danger</h2>
        <div className="tw:flex tw:gap-4 tw:my-4 tw:items-center">
          <IconButton variant="danger" size="small" aria-label="Add item">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="6" fill="currentColor" />
            </svg>
          </IconButton>
          <IconButton variant="danger" size="medium" aria-label="Add item">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="6" fill="currentColor" />
            </svg>
          </IconButton>
          <IconButton variant="danger" size="large" aria-label="Add item">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="6" fill="currentColor" />
            </svg>
          </IconButton>
          <IconButton variant="danger" size="xlarge" aria-label="Add item">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="6" fill="currentColor" />
            </svg>
          </IconButton>
        </div>
      </div>
      <div>
        <h2>Disabled</h2>
        <div className="tw:flex tw:gap-4 tw:my-4 tw:items-center">
          <IconButton variant="primary" size="small" disabled aria-label="Add item">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="6" fill="currentColor" />
            </svg>
          </IconButton>
          <IconButton variant="secondary" size="medium" disabled aria-label="Add item">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="6" fill="currentColor" />
            </svg>
          </IconButton>
          <IconButton variant="danger" size="large" disabled aria-label="Add item">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="6" fill="currentColor" />
            </svg>
          </IconButton>
        </div>
        <h2>Loading</h2>
        <div className="tw:flex tw:gap-4 tw:my-4 tw:items-center">
          <IconButton variant="primary" size="small" loading aria-label="Add item">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="6" fill="currentColor" />
            </svg>
          </IconButton>
          <IconButton variant="secondary" loading={isLoading} onClick={handleClick} aria-label="Add item">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="6" fill="currentColor" />
            </svg>
          </IconButton>
          <IconButton size="large" loading={isLoading} onClick={handleClick} aria-label="Add item">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="6" fill="currentColor" />
            </svg>
          </IconButton>
          <IconButton variant="danger" size="xlarge" loading={isLoading} onClick={handleClick} aria-label="Add item">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="6" fill="currentColor" />
            </svg>
          </IconButton>
        </div>
      </div>
    </div>
  );
};
