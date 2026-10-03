# Muth Nabi Mega Quiz 2026

A fast, mobile-first registration page for the online Muth Nabi Mega Quiz at TKM College of Engineering.

- **When:** 5 October 2026 at 7:00 PM IST
- **Who can register:** All TKM students
- **Site:** static files in `site/`, published with GitHub Pages
- **Registration storage:** private Google Sheet, written by `apps-script/Code.gs`

## Preview and checks

Requires Node.js 20 or later. No frontend packages are needed.

```sh
npm test
npm run check
```

To preview, serve the `site/` directory with any static web server. The form will clearly report that submissions are not connected until the Apps Script endpoint is configured.

## Connect registrations to a Google Sheet

1. Create a Google spreadsheet named **Muth Nabi Quiz 2026 Registrations**. Keep its sharing set to **Restricted** and only grant access to the event organizers. Registrants do not need access to the Sheet.
2. In the Sheet, choose **Extensions → Apps Script**.
3. Replace the editor contents with `apps-script/Code.gs` from this repository, then save.
4. Select and run `setupRegistrationSheet` once from the Apps Script editor. Review and approve the requested spreadsheet access. This creates a `Registrations` tab with the headers `Submitted At`, `Name`, `Number`, `Email`, `Department`, `Class`, and `Gender`, and stores the spreadsheet ID in the Apps Script project's private script properties.
5. In Apps Script, choose **Deploy → New deployment**, select **Web app**, set **Execute as** to your account, and set **Who has access** to **Anyone** so the public registration page can submit. Deploy and complete Google's authorization prompt.
6. Copy the deployed web-app URL (the one ending in `/exec`) into `SUBMISSION_ENDPOINT` in `site/config.js`. The endpoint URL is public; the spreadsheet stays restricted and its ID/contents are not placed in the website. If you later change the Apps Script code, create a new deployment version and update the URL if Google issues a new one.
7. Run `npm test` and `npm run check`, then commit and push the change. GitHub Actions will publish it to Pages after the checks pass.

The Apps Script validates submissions again on the server and writes the timestamp itself. Do not paste spreadsheet data, credentials, or private access tokens into this repository.

## GitHub Pages and CI/CD

The workflow in `.github/workflows/pages.yml` runs syntax checks and registration tests on pull requests. A successful push to `main` deploys the `site/` directory to GitHub Pages.

After creating the repository, ensure **Settings → Pages → Build and deployment → Source** is set to **GitHub Actions**. The site URL will be shown in the workflow deployment summary and under Pages settings.
