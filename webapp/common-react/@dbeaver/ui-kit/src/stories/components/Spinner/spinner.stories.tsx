import { Spinner } from '../../../index.js';
import './spinner.stories.css';

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
        <span class="dbv-kit-spinner">
          <svg class="dbv-kit-spinner__svg">
            <circle class="dbv-kit-spinner__circle" />
          </svg>
        </span>
        `}
      </pre>
      <h2>Class names</h2>
      <p>
        The Spin component uses the following class names:
        <ul>
          <li>
            <code>dbv-kit-spinner</code>: Base class for the spinner.
          </li>
          <li>
            <code>dbv-kit-spinner--small</code>: Small size variant.
          </li>
          <li>
            <code>dbv-kit-spinner--medium</code>: Medium size variant.
          </li>
          <li>
            <code>dbv-kit-spinner--large</code>: Large size variant.
          </li>
          <li>
            <code>dbv-kit-spinner--xlarge</code>: Extra large size variant.
          </li>
          <li>
            <code>dbv-kit-spinner__svg</code>: SVG element for the spinner.
          </li>
          <li>
            <code>dbv-kit-spinner__circle</code>: Circle element for the spinner.
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
          <p>small</p> <Spinner size="small" />
        </div>
        <div>
          <p>medium</p> <Spinner size="medium" />
        </div>
        <div>
          <p>large</p> <Spinner size="large" />
        </div>
        <div>
          <p>xlarge</p> <Spinner size="xlarge" />
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
          <code>--dbv-kit-spinner-height</code>: Controls the height of the spinner (default: var(--dbv-kit-control-height-medium))
        </li>
        <li>
          <code>--dbv-kit-spinner-stroke-width</code>: Specifies the width of the spinner's stroke (default: 2.5px)
        </li>
        <li>
          <code>--dbv-kit-spinner-stroke-color</code>: Sets the color of the spinner's stroke (default: var(--dbv-kit-color-primary-600))
        </li>
        <li>
          <code>--dbv-kit-spinner-stroke-linecap</code>: Defines the stroke-linecap of the spinner's stroke (default: butt)
        </li>
        <code>--dbv-kit-spinner-stroke-color-secondary</code>: Sets the color of the spinner's secondary stroke (default:
        var(--dbv-kit-color-primary-200))
        <li>
          <code>--dbv-kit-spinner-animation-duration</code>: Controls the duration of the spinner's animation (default: 1.8s)
        </li>
        <li>
          <code>--dbv-kit-spinner-animation-delay</code>: Controls the delay of the spinner's animation (default: -0.3s). This is used to start
          spinner animation not from the small dot but with semi-filled circle, which looks better.
        </li>
        <li>
          <code>--dbv-kit-animate-stroke</code>: Defines the animation for the spinner's stroke
        </li>
        <li>
          <code>--dbv-kit-animate-spin</code>: Defines the animation for the spinner's rotation
        </li>
      </ul>
    </div>
  );
}

export function SpecialLoader() {
  return (
    <div className="tw:flex tw:h-screen tw:items-center tw:justify-center">
      <div className="tw:flex tw:flex-col tw:gap-1 tw:w-32">
        <div className="tw:relative tw:flex tw:items-center tw:justify-center tw:w-32 tw:h-32 ">
          <span className="tw:text-6xl">😜</span>
          <Spinner className="tw:absolute tw:w-full tw:h-full customLoader" />
        </div>
        <p className="tw:text-center">Loading...</p>
      </div>
    </div>
  );
}
