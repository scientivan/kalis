# Dien's frontend preferences

Latest direction overrides the reference dimensions where stated.

- Make the Marketplace slightly smaller at 100% browser zoom.
- Use a narrower left sidebar. Current implementation uses 240px instead of 280px.
- Keep the desktop sidebar visible while the page scrolls. Use sticky positioning and independent overflow so every navigation item remains reachable.
- Compact spacing, icons and typography without CSS zoom or transforms that shrink interaction targets. Keep body text readable, controls 38px and primary actions 50px.
- On mobile retain the collapsible navigation and avoid a sticky panel consuming the viewport.

Latest image-based revision supersedes the 240px sidebar. Use a narrow rounded capsule icon rail with separators between navigation groups, matching the supplied silhouette. Retain the light Kalis palette. Every icon keeps an accessible name and hover title. Keep the rail sticky and all navigation destinations accessible. Main content should be compact enough to reduce vertical scrolling, without shrinking readable body text or action targets.

Sidebar must be centered vertically in the viewport. Expand the capsule on hover and keyboard focus to reveal navigation labels, overlaying content without layout shift. Touch navigation opens with visible labels. Continue reducing page whitespace and component height across Marketplace and legacy pages while retaining readable text and control targets.

Latest correction. Expanding the sidebar must move the main content right and reserve layout width, preventing overlap. Main method cards and tables should use smaller text and icon sizes, and categories should remain a compact horizontal strip to avoid extra rows.

Move the horizontal header into the vertical sidebar. Place Kalis branding and search above the navigation, and notifications, current network and wallet below it. Keep the navigation section independently scrollable between these utilities. Expanded sidebar reveals utility labels and the search input.
