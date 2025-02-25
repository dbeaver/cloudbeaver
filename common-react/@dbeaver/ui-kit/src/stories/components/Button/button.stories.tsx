import type { Story } from '@ladle/react';
import { Button, type ButtonProps } from '../../../index.js';
import { ButtonTokens } from './button-tokens.js';
import { useState } from 'react';

export const Docs = () => (
  <div>
    <h1>Button</h1>
    <p>The Button component is a simple button that can be used in different contexts. It has several visual parameters that can be customized.</p>
    <h2>Class names</h2>
    <p>
      <code>.dbv-kit-button</code> - the main class name for the button component. <br />
      <code>.dbv-kit-button--primary</code> - the class name for the primary variant. <br />
      <code>.dbv-kit-button--secondary</code> - the class name for the secondary variant. <br />
      <code>.dbv-kit-button--danger</code> - the class name for the danger variant. <br />
      <code>.dbv-kit-button--small</code> - the class name for the small size. <br />
      <code>.dbv-kit-button--medium</code> - the class name for the medium size. <br />
      <code>.dbv-kit-button--large</code> - the class name for the large size. <br />
      <code>.dbv-kit-button--xlarge</code> - the class name for the extra large size. <br />
      <hr></hr>
      <code>.dbv-kit-button__icon</code> - the class name for the icon component. <br />
      <code>.dbv-kit-button__icon--start</code> - the class name for the icon with placement="start". <br />
      <code>.dbv-kit-button__icon--end</code> - the class name for the icon with placement="end". <br />
    </p>
    <p>
      Underlying components docs: <br />
      <a target="_blank" href="https://ariakit.org/reference/button">
        https://ariakit.org/reference/button
      </a>
    </p>
    <h3>Props:</h3>
    <dl>
      <dt className="tw:font-bold">variant</dt>
      <dd>primary | secondary | danger</dd>
      <dt className="tw:font-bold">size</dt>
      <dd>small | medium | large | xlarge</dd>
      <dt className="tw:font-bold">loading</dt>
      <dd>boolean</dd>
    </dl>
  </div>
);

Docs.storyName = '0Documentation';

export const Variants = () => (
  <div>
    <h3 className="tw:text-lg tw:my-2">Variants</h3>
    <p>Button component has 3 predefined variants: primary, secondary, and danger.</p>
    <div className="codeblock tw:bg-gray-100 tw:p-4 tw:my-4">
      <code>&lt;Button variant="primary"/&gt;</code>
    </div>
    <div className="tw:flex tw:gap-4 tw:my-4 tw:items-center">
      <Button>Primary</Button>
      <Button disabled>Disabled</Button>
    </div>

    <div className="tw:flex tw:gap-4 tw:my-4 tw:items-center">
      <Button variant="secondary">Secondary</Button>
      <Button variant="secondary" disabled>
        Disabled
      </Button>
    </div>
    <div className="tw:flex tw:gap-4 tw:my-4 tw:items-center">
      <Button variant="danger">Danger</Button>
      <Button variant="danger" disabled>
        Disabled
      </Button>
    </div>

    <div className="tw:my-4">
      <h3>Design tokens for variants</h3>
      <p className="tw:text-base">
        Primary button background: <code>--dbv-kit-btn-primary-background</code>
      </p>
      <p className="tw:text-base">
        Primary button background (hover): <code>--dbv-kit-btn-primary-background-hover</code>
      </p>
      <p className="tw:text-base">
        Primary button background (active): <code>--dbv-kit-btn-primary-background-active</code>
      </p>
      <p className="tw:text-base">
        Secondary button background: <code>--dbv-kit-btn-secondary-background</code>
      </p>
      <p className="tw:text-base">
        Secondary button background (hover): <code>--dbv-kit-btn-secondary-background-hover</code>
      </p>
      <p className="tw:text-base">
        Secondary button background (active): <code>--dbv-kit-btn-secondary-background-active</code>
      </p>
      <p className="tw:text-base">
        Secondary button border color: <code>--dbv-kit-btn-secondary-border-color</code>
      </p>
      <p className="tw:text-base">
        Danger button background: <code>--dbv-kit-btn-danger-background</code>
      </p>
      <p className="tw:text-base">
        Danger button background (hover): <code>--dbv-kit-btn-danger-background-hover</code>
      </p>
      <p className="tw:text-base">
        Danger button background (active): <code>--dbv-kit-btn-danger-background-active</code>
      </p>
    </div>
  </div>
);

Variants.storyName = '1Variants';

export const Sizes = () => (
  <div>
    <h2 className="tw:text-lg tw:my-2">Sizes</h2>
    <p>Button component has 4 predefined sizes: small, medium, large, and extra large. Check the examples below:</p>
    <div className="tw:flex tw:flex-col tw:gap-4">
      <Button size="small">Small</Button>
      <Button size="medium">Medium</Button>
      <Button size="large">Large button</Button>
      <Button size="xlarge">EXTRA Large button</Button>
    </div>
    <h3>Design tokens for sizes</h3>
    <p>
      The Button component uses the following design tokens to define the sizes of the buttons. You can customize these tokens to change the button
      sizes.
    </p>
    <div className="tw:my-4">
      <p className="tw:text-base">
        Small button height: <code>--dbv-kit-btn-small-height</code>
      </p>
      <p className="tw:text-base">
        Medium button height: <code>--dbv-kit-btn-medium-height</code>
      </p>
      <p className="tw:text-base">
        Large button height: <code>--dbv-kit-btn-large-height</code>
      </p>
      <p className="tw:text-base">
        Extra large button height: <code>--dbv-kit-btn-xlarge-height</code>
      </p>
    </div>
  </div>
);

Sizes.storyName = '2Sizes';

export const Icons = () => (
  <div>
    <h2>Icons</h2>
    <h3>&lt;Button.Icon&gt;</h3>
    <code>.dbv-kit-button__icon</code>
    <p>
      To properly place an icon inside a button, you have to use Button.Icon component. That component will compensate outer padding to balance the
      button view. You need to specify the placement property to adjust the icon position.
    </p>
    <dl>
      <dt className="tw:font-semibold">placement</dt>
      <dd>start | end</dd>
    </dl>
    <div className="codeblock">
      <code>
        &lt;Button&gt; <br /> &nbsp;&nbsp;&lt;Button.Icon placement="start"/&gt;
        <br />
        &nbsp; Text
        <br /> &lt;Button/&gt;
      </code>
    </div>

    <div>
      <h4>Compare buttons:</h4>
      <div className="tw:flex tw:gap-4 tw:items-center tw:my-4">
        <Button variant="secondary">
          <Button.Icon placement="start">🧤</Button.Icon>
          Text
        </Button>
        <Button variant="secondary">🧤 Text</Button>
      </div>
      <p>
        The left button uses Button.Icon component and looks more balanced. If you feel that in your case it's not needed, feel free to not use the
        <b> Button.Icon </b> component.
      </p>
    </div>

    <h3>Tokens</h3>
    <div>
      <code>--dbv-kit-btn-icon-margin-inline</code> - the margin between the icon and the text, by default calculated based on{' '}
      <code>--dbv-kit-btn-padding-inline</code> for each size.
    </div>

    <h3>Examples</h3>
    <p>
      Here are some examples of how to use the Button component with icons. Don't forget to check the source code by pressing <kbd>s</kbd>
    </p>
    <div className="tw:flex tw:gap-4 tw:my-4 tw:items-center">
      <Button size="small">
        Love
        <Button.Icon placement="end">❤️</Button.Icon>
      </Button>

      <Button className="tw:text-lime-300">
        Have you seen
        <Button.Icon className="w-2">
          <svg width="16" height="16" fill="none">
            <g strokeWidth="0"></g>
            <g strokeLinecap="round" strokeLinejoin="round"></g>
            <g>
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M8 16L3.54223 12.3383C1.93278 11.0162 1 9.04287 1 6.96005C1 3.11612 4.15607 0 8 0C11.8439 0 15 3.11612 15 6.96005C15 9.04287 14.0672 11.0162 12.4578 12.3383L8 16ZM3 6H5C6.10457 6 7 6.89543 7 8V9L3 7.5V6ZM11 6C9.89543 6 9 6.89543 9 8V9L13 7.5V6H11Z"
                fill="currentColor"
              ></path>
            </g>
          </svg>
        </Button.Icon>
        UFO?
      </Button>

      <Button size="large">
        <Button.Icon placement="start">🎾</Button.Icon>
        Tennis
      </Button>

      <Button size="xlarge">
        <Button.Icon placement="start">🎾</Button.Icon>
        Tennis is Love
        <Button.Icon placement="end">❤️</Button.Icon>
      </Button>
    </div>
    <div className="tw:flex tw:gap-4 tw:my-4 tw:items-center">
      <Button loading>
        <Button.Icon className="tw:w-8 tw:h-4" placement="start">
          <svg width="16" height="16" fill="none">
            <g strokeWidth="0"></g>
            <g strokeLinecap="round" strokeLinejoin="round"></g>
            <g>
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M8 16L3.54223 12.3383C1.93278 11.0162 1 9.04287 1 6.96005C1 3.11612 4.15607 0 8 0C11.8439 0 15 3.11612 15 6.96005C15 9.04287 14.0672 11.0162 12.4578 12.3383L8 16ZM3 6H5C6.10457 6 7 6.89543 7 8V9L3 7.5V6ZM11 6C9.89543 6 9 6.89543 9 8V9L13 7.5V6H11Z"
                fill="currentColor"
              ></path>
            </g>
          </svg>
        </Button.Icon>
        UFO
      </Button>
      <Button variant="secondary" loading>
        <Button.Icon placement="start">🎾</Button.Icon>
        Tennis
      </Button>
      <Button disabled>
        <Button.Icon placement="start">🎾</Button.Icon>
        Tennis
      </Button>
      <Button variant="danger">
        <Button.Icon placement="start">🎾</Button.Icon>
        Tennis
      </Button>
      <Button>
        <Button.Icon>🎾</Button.Icon>
      </Button>
    </div>
  </div>
);

Icons.storyName = '3Icons';

const CustomLoader = () => (
  <Button.Icon placement="start">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="tw:animate-spin tw:p-1">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="31.415, 31.415" />
    </svg>
  </Button.Icon>
);

export const Loading = () => {
  const [loading, setLoading] = useState(true);

  function toggleLoading() {
    setLoading(prev => !prev);
  }

  return (
    <div>
      <h2>Loading</h2>
      <h3>Design tokens</h3>
      <p>
        <code>--dbv-kit-btn-loader-base-color:</code> var(--tw-color-white);{' '}
        <span className="comment">
          // This color used in loader to mix with other button colors like{' '}
          <i> color: color-mix(in srgb, var(--dbv-kit-btn-foreground) 25%, var(--dbv-kit-btn-loader-base-color));</i> It should be light in light mode
          and one of the dark colors for dark theme.
        </span>
      </p>
      <div>
        <code>--dbv-kit-btn-loader-animation:</code> var(--animate-spin); <span className="comment"> Button loader animation</span>
      </div>
      <label>
        Enable loaders <input type="checkbox" checked={loading} onChange={toggleLoading} />
      </label>
      <h3>Default loader</h3>
      <p>Button component has a default loader that appears when the loading property is set to true.</p>
      <div className="tw:flex tw:gap-4 tw:my-4 tw:items-center">
        <Button loading={loading}>Primary</Button>
        <Button variant="secondary" loading={loading}>
          Secondary
        </Button>
        <Button variant="danger" loading={loading}>
          Danger
        </Button>
      </div>
      <h3> Custom loader</h3>

      <p>Buttons support custom loaders.</p>

      <div className="tw:flex tw:gap-4 tw:my-4 tw:items-center">
        <Button loading={loading} loader={<span className="tw:flex tw:items-center tw:animate-spin">⚽️</span>}>
          Loading
        </Button>

        <Button loading={loading} loader={<span className="tw:absolute tw:animate-bounce">🚴</span>}>
          Loading
        </Button>

        <Button loading={loading} loader={<CustomLoader />}>
          Custom SVG Loader
        </Button>
      </div>
    </div>
  );
};

Loading.storyName = '4Loading';

export const CustomRendering = () => {
  return (
    <div>
      <h3 className="tw:text-lg tw:my-2">Custom renders</h3>
      <p>
        Button can be rendered as different HTML element using <code>render</code> property. Read more{' '}
        <a href="https://ariakit.org/reference/button#render">in AriaKit documentation</a>
      </p>
      <div className="tw:flex tw:gap-4 tw:my-4 tw:items-center">
        <Button render={<a target="_blank" href="/" />} size="small">
          Link button
        </Button>
        <Button variant="secondary" render={<a />}>
          Link secondary
        </Button>
        <Button render={({ children, className }) => <p className={className}>{children} render</p>} size="medium">
          Paragraph
        </Button>
      </div>
      <h3 className="tw:text-lg tw:my-2">Change on focus</h3>
      <div className="tw:flex tw:gap-4 tw:my-4 tw:items-center">
        <Button onFocusVisible={e => (e.currentTarget.textContent = 'Click me!')} render={<a href="/" />} size="small">
          Link button
        </Button>
      </div>
    </div>
  );
};

CustomRendering.storyName = '5Custom rendering';

const Primary: Story<ButtonProps> = props => <Button {...props}>Primary</Button>;
export const Interactive = Primary.bind({});

Interactive.argTypes = {
  variant: {
    options: ['primary', 'secondary', 'danger'],
    control: {
      type: 'select',
    },
    defaultValue: 'primary',
  },
  size: {
    options: ['small', 'medium', 'large', 'xlarge'],
    control: {
      type: 'select',
    },
    defaultValue: 'medium',
  },
  loading: {
    control: {
      type: 'boolean',
    },
    defaultValue: false,
  },
};

Interactive.storyName = '6Interactive';

export const Tokens = ButtonTokens;

Tokens.storyName = '7Tokens';
