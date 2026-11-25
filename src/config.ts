// Links that change when YourTab is published. Replace the placeholders with the real URLs.
export const CHROME_WEB_STORE_URL = 'CHROME_WEB_STORE_URL'
export const FIREFOX_ADDONS_URL = 'FIREFOX_ADDONS_URL'
export const GITHUB_URL = 'GITHUB_URL'
/** A file in public/, wherever the site is hosted (a custom domain, or a GitHub Pages subpath). */
export const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`

export const PRIVACY_URL = asset('privacy.html')
