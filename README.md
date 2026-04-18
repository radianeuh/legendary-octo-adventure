# Turkey Fake Address Chrome Extension

A simple Chrome extension popup that fetches fake Turkey address data from:

- https://www.fakeaddressgenerator.com/All_countries/address/country/Turkey

## Behavior

- First popup open: fetches once and stores the parsed data.
- Reopening popup: uses cached data (no automatic refetch).
- Clicking **Refresh**: fetches new data and replaces cache.
- If the source site serves a Cloudflare challenge page, the popup shows a clear error message instead of parsing invalid HTML.
- Popup UI uses dark mode styling.

## Load extension

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select this repository folder.
