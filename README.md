# Helvety SPO Explorer

SharePoint Framework (SPFx) application customizer that adds a "Sites available to you" navigation button and panel.

## Highlights

- Site discovery via SharePoint Search API
- Fast search across title, description, and URL
- Favorites with quick-access dropdown
- Settings for URL and description display
- About tab with app/contact/version/build info
- Light/dark SharePoint theme compatibility
- Keyboard and screen-reader accessibility support

## Privacy model

User preferences are stored locally in browser storage. Site data is fetched from SharePoint APIs in the current tenant context.

## Deployment

1. Upload the `.sppkg` to the tenant App Catalog.
2. Enable and add to all sites for tenant-wide availability.
3. Wait for normal SharePoint propagation, then verify in Tenant Wide Extensions.

## Package access

The official package is available from the Helvety Store product page:
[https://helvety.com/store/products/helvety-spo-explorer](https://helvety.com/store/products/helvety-spo-explorer)

## License & usage

This project is open source under the [MIT License](./LICENSE).

You may use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of this software, provided the copyright and permission notice are
included in substantial portions of the software.

The software is provided "as is", without warranty of any kind. See
[LICENSE](./LICENSE) for full legal terms.
