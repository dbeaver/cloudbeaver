import React from 'react';
import { Meta } from '@ladle/react';

export default {
  title: 'Design Tokens',
} as Meta;

export const GlobalTokens = () => {
  return (
    <div className="p-4 my-4">
      <h1 className="text-2xl font-bold">Global CSS Tokens</h1>
      <p className="text-base">
        This UI kit uses several global CSS tokens defined in the <code>index.css</code> file. These tokens help maintain consistency across the UI
        components.
      </p>
      <div className="my-4">
        <h2 className="text-xl font-semibold">Font Size</h2>
        <p className="text-base" style={{ fontSize: 'var(--font-size-base)' }}>
          Base font size: <code>--font-size-base</code>
        </p>
        <p className="text-base">
          The <code>--font-size-base</code> token is used to set the base font size for text in the UI kit. It ensures consistent typography across
          different components.
        </p>
      </div>

      <div className="my-4">
        <h2 className="text-xl font-semibold">Control Heights</h2>
        <p className="text-base" style={{ height: 'var(--control-height-small)', backgroundColor: 'var(--color-background)' }}>
          Small control height: <code>--control-height-small</code>
        </p>
        <p className="text-base" style={{ height: 'var(--control-height-medium)', backgroundColor: 'var(--color-background)' }}>
          Medium control height: <code>--control-height-medium</code>
        </p>
        <p className="text-base" style={{ height: 'var(--control-height-large)', backgroundColor: 'var(--color-background)' }}>
          Large control height: <code>--control-height-large</code>
        </p>
        <p className="text-base" style={{ height: 'var(--control-height-xlarge)', backgroundColor: 'var(--color-background)' }}>
          Extra large control height: <code>--control-height-xlarge</code>
        </p>
        <p className="text-base">
          The <code>--control-height-*</code> tokens are used to define the height of various UI controls, such as buttons, selects, and input fields.
          These tokens ensure consistent sizing across different components. Use these tokens to set the height of controls in your application.
        </p>
      </div>
      <div className="my-4">
        <h2 className="text-xl font-semibold">Base Sizes</h2>
        <p className="text-base">
          The <code>--font-size-base</code> and <code>--control-height-base</code> tokens use <code>rem</code> units by default. This ensures that the
          base font size and control height are consistent with the user's browser settings. If the user changes the browser's font size, these base
          sizes will adjust accordingly, maintaining a consistent view.
        </p>
        <p className="text-base">
          Other font sizes and control heights are calculated from these base sizes, ensuring proportional scaling across the UI components.
        </p>
      </div>
      <div className="my-4">
        <h2 className="text-xl font-semibold">Colors</h2>
        <p className="text-base" style={{ color: 'var(--color-foreground)' }}>
          Foreground color: <code>--color-foreground</code>
        </p>
        <p className="text-base" style={{ backgroundColor: 'var(--color-background)' }}>
          Background color: <code>--color-background</code>
        </p>
        <p className="text-base" style={{ color: 'var(--color-text)' }}>
          Text color: <code>--color-text</code>
        </p>
        <p className="text-base" style={{ backgroundColor: 'var(--color-primary-50)' }}>
          Primary color (50): <code>--color-primary-50</code>
        </p>
        <p className="text-base" style={{ backgroundColor: 'var(--color-primary-100)' }}>
          Primary color (100): <code>--color-primary-100</code>
        </p>
        <p className="text-base" style={{ backgroundColor: 'var(--color-primary-200)' }}>
          Primary color (200): <code>--color-primary-200</code>
        </p>
        <p className="text-base text-white" style={{ backgroundColor: 'var(--color-primary-500)' }}>
          Primary color (500): <code>--color-primary-500</code>
        </p>
        <p className="text-base text-white" style={{ backgroundColor: 'var(--color-primary-600)' }}>
          Primary color (600): <code>--color-primary-600</code>
        </p>
        <p className="text-base text-white" style={{ backgroundColor: 'var(--color-primary-700)' }}>
          Primary color (700): <code>--color-primary-700</code>
        </p>
        <p className="text-base text-white" style={{ backgroundColor: 'var(--color-primary-800)' }}>
          Primary color (800): <code>--color-primary-800</code>
        </p>
        <p className="text-base text-white" style={{ backgroundColor: 'var(--color-primary-900)' }}>
          Primary color (900): <code>--color-primary-900</code>
        </p>
        <p
          className="text-base my-1"
          style={{
            backgroundColor: 'var(--color-error-background)',
            color: 'var(--color-error-text)',
            border: '2px solid  var(--color-error-border)',
          }}
        >
          Error color: <code>--color-error-background</code> / <code>--color-error-text</code> / <code>--color-error-border</code>
        </p>
        <p
          className="text-base my-1"
          style={{ backgroundColor: 'var(--color-info-background)', color: 'var(--color-info-text)', border: '2px solid var(--color-info-border)' }}
        >
          Info color: <code>--color-info-background</code> / <code>--color-info-text</code> / <code>--color-info-border</code>
        </p>
        <p
          className="text-base my-1"
          style={{
            backgroundColor: 'var(--color-warning-background)',
            color: 'var(--color-warning-text)',
            border: '2px solid var(--color-warning-border)',
          }}
        >
          Warning color: <code>--color-warning-background</code> / <code>--color-warning-text</code> / <code>--color-warning-border</code>
        </p>
      </div>
    </div>
  );
};

GlobalTokens.storyName = 'Global';

export const ButtonTokens = () => {
  return (
    <div className="p-4 my-4">
      <h1 className="text-2xl font-bold">Button CSS Tokens</h1>
      <p className="text-base">This UI kit uses several CSS tokens to style buttons.</p>
      <h2 className="text-xl font-semibold">Common buttons tokens</h2>
      <div className="my-4">
        <div>
          <code>--btn-height:</code> var(--control-height-medium); <span className="comment">// Default button height</span>
        </div>
        <div>
          <code>--btn-padding-inline:</code> --spacing(2.5);
          <span className="comment"> // Medium button inline paddings, other sizes are calculated based on that variable</span>
        </div>
        <div>
          <code>--btn-gap:</code> calc(var(--btn-padding-inline) /4);{' '}
          <span className="comment"> // Gap between button elements (mostly text and icon) </span>
        </div>
        <div>
          <code>--btn-foreground:</code> var(--color-white); <span className="comment">// Default button text color</span>
        </div>
        <div>
          <code>--btn-background:</code> var(--color-primary-600); <span className="comment">// Default button background color</span>
        </div>
        <div>
          <code>--btn-background-hover:</code> var(--color-primary-700); <span className="comment">// Button hover background color</span>
        </div>
        <div>
          <code>--btn-background-active:</code> var(--color-primary-800); <span className="comment">// Button active background color</span>
        </div>
        <div>
          <code>--btn-border-width:</code> 1px; <span className="comment">// Button border width</span>
        </div>
        <div>
          <code>--btn-border-color:</code> transparent; --btn-border-style: solid; <span className="comment">// Button border color and style</span>
        </div>
        <div>
          <code>--btn-radius:</code> var(--radius-md); <span className="comment">// Button border radius</span>
        </div>
        <div>
          <code>--btn-font-weight:</code> var(--font-weight-normal); <span className="comment">// Button font weight</span>
        </div>
        <div>
          <code>--btn-font-size:</code> calc(var(--font-size-base) * 0.875);{' '}
          <span className="comment">// Button font size, default for medium-sized button, other sizes calculated based on that value</span>
        </div>
        <div>
          <code>--btn-disabled-opacity:</code> 0.5; <span className="comment">// Button opacity when disabled</span>
        </div>
        <div>
          <code>--btn-loader-animation:</code> var(--animate-spin); <span className="comment">// Button loader animation</span>
        </div>
      </div>
      <div className="my-4">
        <h2 className="text-xl font-semibold">Specific buttons tokens</h2>
        <h3 className="text-lg font-semibold">Button Sizes</h3>
        <p className="text-base" style={{ height: 'var(--btn-small-height)', backgroundColor: 'var(--btn-background)' }}>
          Small button height: <code>--btn-small-height</code>
        </p>
        <p className="text-base" style={{ height: 'var(--btn-medium-height)', backgroundColor: 'var(--btn-background)' }}>
          Medium button height: <code>--btn-medium-height</code>
        </p>
        <p className="text-base" style={{ height: 'var(--btn-large-height)', backgroundColor: 'var(--btn-background)' }}>
          Large button height: <code>--btn-large-height</code>
        </p>
        <p className="text-base" style={{ height: 'var(--btn-xlarge-height)', backgroundColor: 'var(--btn-background)' }}>
          Extra large button height: <code>--btn-xlarge-height</code>
        </p>
        <p className="text-base">
          The <code>--btn-*-height</code> tokens are used to define the height of buttons for different size variants. Default buttons use{' '}
          <code>--control-height-*</code> variable as the base height.
        </p>
      </div>
      <div className="my-4">
        <h3 className="text-lg font-semibold">Button Padding</h3>
        <p className="text-base" style={{ paddingInline: 'var(--btn-small-padding-inline)', backgroundColor: 'var(--btn-background)' }}>
          Small button padding: <code>--btn-small-padding-inline</code>
        </p>
        <p className="text-base" style={{ paddingInline: 'var(--btn-medium-padding-inline)', backgroundColor: 'var(--btn-background)' }}>
          Medium button padding: <code>--btn-medium-padding-inline</code>
        </p>
        <p className="text-base" style={{ paddingInline: 'var(--btn-large-padding-inline)', backgroundColor: 'var(--btn-background)' }}>
          Large button padding: <code>--btn-large-padding-inline</code>
        </p>
        <p className="text-base" style={{ paddingInline: 'var(--btn-xlarge-padding-inline)', backgroundColor: 'var(--btn-background)' }}>
          Extra large button padding: <code>--btn-xlarge-padding-inline</code>
        </p>
        <p className="text-base">
          The <code>--btn-*-padding-inline</code> tokens are used to define the padding of buttons for different size variants.
        </p>
      </div>
      <div className="my-4">
        <h3 className="text-lg font-semibold">Button Colors</h3>
        <p className="text-base" style={{ backgroundColor: 'var(--btn-primary-background)', color: 'var(--btn-primary-foreground)' }}>
          Primary button background: <code>--btn-primary-background</code>
        </p>
        <p className="text-base" style={{ backgroundColor: 'var(--btn-primary-background-hover)', color: 'var(--btn-primary-foreground)' }}>
          Primary button background (hover): <code>--btn-primary-background-hover</code>
        </p>
        <p className="text-base" style={{ backgroundColor: 'var(--btn-primary-background-active)', color: 'var(--btn-primary-foreground)' }}>
          Primary button background (active): <code>--btn-primary-background-active</code>
        </p>
        <p className="text-base" style={{ backgroundColor: 'var(--btn-secondary-background)', color: 'var(--btn-secondary-foreground)' }}>
          Secondary button background: <code>--btn-secondary-background</code>
        </p>
        <p className="text-base" style={{ backgroundColor: 'var(--btn-secondary-background-hover)', color: 'var(--btn-secondary-foreground)' }}>
          Secondary button background (hover): <code>--btn-secondary-background-hover</code>
        </p>
        <p className="text-base" style={{ backgroundColor: 'var(--btn-secondary-background-active)', color: 'var(--btn-secondary-foreground)' }}>
          Secondary button background (active): <code>--btn-secondary-background-active</code>
        </p>
        <p className="text-base" style={{ borderColor: 'var(--btn-secondary-border-color)', borderWidth: '1px', borderStyle: 'solid' }}>
          Secondary button border color: <code>--btn-secondary-border-color</code>
        </p>
        <p className="text-base" style={{ backgroundColor: 'var(--btn-danger-background)', color: 'var(--btn-danger-foreground)' }}>
          Danger button background: <code>--btn-danger-background</code>
        </p>
        <p className="text-base" style={{ backgroundColor: 'var(--btn-danger-background-hover)', color: 'var(--btn-danger-foreground)' }}>
          Danger button background (hover): <code>--btn-danger-background-hover</code>
        </p>
        <p className="text-base" style={{ backgroundColor: 'var(--btn-danger-background-active)', color: 'var(--btn-danger-foreground)' }}>
          Danger button background (active): <code>--btn-danger-background-active</code>
        </p>
        <p className="text-base">
          The <code>--btn-*-background</code> and <code>--btn-*-foreground</code> tokens are used to define the background and text color of buttons
          for different variants (primary, secondary, danger).
        </p>
        <p className="text-base">
          To set another background or text color for your button, you can override the respective <code>--btn-*</code> tokens in your CSS.
        </p>
      </div>
      <div className="my-4">
        <h3 className="text-lg font-semibold">Button Borders</h3>
        <p className="text-base" style={{ borderWidth: 'var(--btn-border-width)', borderColor: 'var(--btn-border-color)', borderStyle: 'solid' }}>
          Button border width: <code>--btn-border-width</code>
        </p>
        <p className="text-base">
          The <code>--btn-border-width</code> token is used to define the border width of buttons.
        </p>
        <p className="text-base">
          To change the border size of your button, you can override the <code>--btn-border-width</code> token in your CSS.
        </p>
      </div>
    </div>
  );
};

ButtonTokens.storyName = 'Buttons';
