import { Spin } from '../../../index.js';

export function Documentation() {
  return (
    <div>
      <h1>Spin</h1>
      <p>Loading spinner component.</p>
      <h2>Usage</h2>
      <p>Use the Spin component to indicate loading state.</p>
      <h2>Anatomy</h2>
      <p>
        The Spin component consists of an SVG element with a circle that rotates to indicate loading. The spinner can be customized with different
        sizes and colors. The spinner is animated using CSS animations.
      </p>
      <pre className="codeblock">
        {`
        <span class="dbv-kit-spin">
          <svg class="dbv-kit-spin__svg">
            <circle class="dbv-kit-spin__circle" />
          </svg>
        </span>
        `}
      </pre>
      <h2>Class names</h2>
      <p>
        The Spin component uses the following class names:
        <ul>
          <li>
            <code>dbv-kit-spin</code>: Base class for the spinner.
          </li>
          <li>
            <code>dbv-kit-spin--small</code>: Small size variant.
          </li>
          <li>
            <code>dbv-kit-spin--medium</code>: Medium size variant.
          </li>
          <li>
            <code>dbv-kit-spin--large</code>: Large size variant.
          </li>
          <li>
            <code>dbv-kit-spin--xlarge</code>: Extra large size variant.
          </li>
          <li>
            <code>dbv-kit-spin__svg</code>: SVG element for the spinner.
          </li>
          <li>
            <code>dbv-kit-spin__circle</code>: Circle element for the spinner.
          </li>
        </ul>
      </p>
      <h2>Example</h2>
      <pre className="codeblock">{`<Spin />`}</pre>
      <h2>Props</h2>
      <table className="tw:w-full tw:table-auto">
        <thead>
          <tr>
            <th className="tw:py-2">Prop</th>
            <th className="tw:py-2">Type</th>
            <th className="tw:py-2">Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="tw:border tw:p-2">size</td>
            <td className="tw:border tw:p-2">
              <pre> small | medium | large | xlarge | undefined</pre>{' '}
            </td>
            <td className="tw:border tw:p-2">Size of the spinner.</td>
          </tr>
          <tr>
            <td className="tw:border tw:p-2">className</td>
            <td className="tw:border tw:p-2">
              <pre> string | undefined</pre>{' '}
            </td>
            <td className="tw:border tw:p-2">Additional class name for the spinner.</td>
          </tr>
          <tr>
            <td className="tw:border tw:p-2">enabled</td>
            <td className="tw:border tw:p-2">
              <pre> true | false | undefined</pre>{' '}
            </td>
            <td className="tw:border tw:p-2">When we want to keep Spin component in the DOM but control </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
export function Sizes() {
  return (
    <div>
      <h1>Spin Sizes</h1>
      <div className="tw:flex tw:flex-col tw:gap-4">
        <div>
          <p>small</p> <Spin size="small" />
        </div>
        <div>
          <p>medium</p> <Spin size="medium" />
        </div>
        <div>
          <p>large</p> <Spin size="large" />
        </div>
        <div>
          <p>xlarge</p> <Spin size="xlarge" />
        </div>
      </div>
    </div>
  );
}

export function Tokens() {
  return (
    <div>
      <h1>Spin Tokens</h1>
      <p>Spin component uses the following CSS custom properties:</p>
      <ul>
        <li>
          <code>--dbv-kit-spin-height</code>: Controls the height of the spinner (default: var(--dbv-kit-control-height-medium))
        </li>
        <li>
          <code>--dbv-kit-spin-stroke-width</code>: Specifies the width of the spinner's stroke (default: 2.5px)
        </li>
        <li>
          <code>--dbv-kit-spin-stroke-color</code>: Sets the color of the spinner's stroke (default: var(--dbv-kit-color-primary-600))
        </li>
        <li>
          <code>--dbv-kit-animate-stroke</code>: Defines the animation for the spinner's stroke (default: stroke 2s linear infinite)
        </li>
      </ul>
    </div>
  );
}
