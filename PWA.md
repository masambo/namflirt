# Mobile app installation

Build with `npm run build` and deploy the complete `dist` directory over HTTPS.
The manifest, icons, service worker and offline page are included automatically.
Serve `/sw.js` with revalidation (`Cache-Control: no-cache`) and a JavaScript
content type. Existing static files must take priority over the SPA fallback.

The landing page and Your profile page offer **Install namflirt.** Supported
browsers open their native installer; other browsers receive installation
instructions. Installed standalone windows hide the button.

The service worker runs only in production. It caches the public offline page,
not profiles, photos, authentication responses or messages. The app requires an
internet connection for its features. When changing the offline page, increment
the cache version in `public/sw.js`; updates activate after old app windows close.

## Device checks after deployment

- On Android Chrome, use Install namflirt., accept, and launch from the home screen.
- On iPhone Safari, use Share → Add to Home Screen and launch the saved app.
- Check navigation, forms and chats at 320px, 390px and tablet widths, including
  landscape, the on-screen keyboard and devices with a home indicator.
- After the first online visit, reload, disconnect and navigate/reload to confirm
  the offline page appears. Reconnect and select Try again.
- Confirm a new deployment loads current content and signing out does not expose
  cached private pages.

`npm test` includes offline navigation, private-request bypass and icon dimension
checks. Native browser install prompts still require testing on real devices.
