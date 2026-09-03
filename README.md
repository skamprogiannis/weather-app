# Generic Weather App™

A responsive weather search interface backed by a Vercel serverless proxy. It presents current conditions, weather alerts, the next 24 hours, and a 14-day outlook without exposing the provider API key to the browser.

[View the live app](https://weather-app-rho-vert-40.vercel.app)

## Highlights

- Location search with Celsius and Fahrenheit units
- Current temperature, wind, humidity, precipitation, and “feels like” conditions
- Expandable weather alerts
- Hourly data that continues correctly into the following day
- Responsive current and 14-day forecast layouts
- Accessible native form controls, keyboard focus, live loading/error feedback, and reduced-motion support
- Vercel Analytics integration

## Architecture

The browser requests `/api/weather` with a location and unit selection. The serverless function validates and bounds those values, constructs an encoded request to the [Visual Crossing Weather API](https://www.visualcrossing.com/weather-api/), and returns the JSON response. The provider key remains in the server environment.

The proxy also enforces GET-only access, applies a short per-instance request limit, times out slow upstream requests, and marks successful forecasts for five minutes of CDN caching. Error responses are never cached and do not expose provider details.

```text
Browser UI -> /api/weather -> Visual Crossing
              validation
              rate limit
              timeout
              CDN cache
```

The in-memory limiter protects an individual serverless instance from bursts. A production deployment should also enable a Vercel Firewall rate-limit rule for `/api/weather` to provide a shared limit across instances.

## Local development

Requirements:

- Node.js 22.15 or newer
- A Visual Crossing API key
- The [Vercel CLI](https://vercel.com/docs/cli) for running the frontend and serverless function together

Install the locked dependencies:

```bash
npm ci
```

Create `.env.local` without committing it:

```dotenv
WEATHER_API_KEY=your_visual_crossing_key
```

Then start the complete application:

```bash
vercel dev
```

`npm run dev` starts Webpack's frontend development server only; API searches require `vercel dev` or a deployed `/api/weather` function.

## Quality checks

```bash
npm test       # server and browser-side behavior
npm run build  # optimized production bundle
npm run check  # both checks in sequence
```

GitHub Actions installs the lockfile on Node.js 22, runs the complete test suite, and builds the same optimized bundle used for deployment.

## Project structure

```text
api/weather.js          Vercel serverless API proxy
src/index.html          Semantic application shell
src/index.js            DOM rendering and interaction flow
src/weather-client.js   Testable browser API and forecast helpers
src/styles.css          Responsive visual system and states
test/                   Node test suites
webpack.config.js       Development and production bundles
```

## Author

Built by [Stefanos Kamprogiannis](https://github.com/skamprogiannis) as part of [The Odin Project](https://www.theodinproject.com/) JavaScript curriculum.

## License

This project is available under the [MIT License](LICENSE).
