# Uni_signal_week1
# MangaCave

## Cloudflare Pages + D1

This project uses Cloudflare Pages Functions and D1 for real shared accounts and manga data.

1. Install Wrangler only if you want to deploy from your own terminal or CI:

	```bash
	npm install --save-dev wrangler
	# Use either browser login or CLOUDFLARE_API_TOKEN, not both.
	npx wrangler login
	```

2. Create the database and copy its ID into `wrangler.toml`:

	```bash
	npx wrangler d1 create mangacave
	npx wrangler d1 execute mangacave --remote --file=schema.sql
	```

	The second command is required. It creates the `users`, `sessions`, `manga`, and `manga_views` tables in the remote database. Without it, the site can load but registration and login will fail.

3. Set the allowed administrator usernames in `wrangler.toml`, for example:

	```toml
	ADMIN_USERNAMES = "lucia,editor2"
	```

	These names are case-insensitive. Users with those names become admins when they register; every other unique username is view-only.

4. For a direct CLI deployment from your own terminal, deploy the Pages site from this folder:

	```bash
	npx wrangler pages deploy . --project-name mangacave
	```

	In Cloudflare Pages, set the D1 binding named `DB` and the `ADMIN_USERNAMES` variable for the production environment as well.

### Cloudflare Pages Git deployment

If this repository is connected to Cloudflare Pages, do **not** set `npx wrangler pages deploy ...` as the Pages build command. Cloudflare Pages is already the deploy system; that command would make the build try to deploy the same project again and requires a second API call with a token. The `account_id` line is optional in this Git deployment mode and should remain omitted if the Pages dashboard manages the project account.

Use these Pages build settings instead:

- Build command: leave empty.
- Build output directory: `.`
- Root directory: leave blank or use the repository root.

Pages will publish the static files and detect the `functions/` directory. In this Git mode, add the D1 binding `DB` under **Settings → Functions → D1 database bindings** for both Production and Preview. Add `ADMIN_USERNAMES` as an environment variable for the same environments. No Cloudflare API token is needed in the Pages build environment.

The binding must be added to the **Pages project** `mangacave`, not to a separate Worker with the same name and not from the D1 database overview. The binding form must use variable name `DB` and database `mangacave`. If the deployment returns `error code: 1101` from `/api/manga`, the Pages runtime does not have this binding yet. `/api/auth/me` can still return `{"user":null}` without D1 because it exits before querying when no session cookie exists.

Use `npx wrangler pages deploy . --project-name mangacave` only from a local terminal or an external CI workflow, never as the build command of the same Pages project. In CLI mode, the `[[d1_databases]]` entry in `wrangler.toml` supplies the `DB` binding, so do not also configure a second binding in the dashboard.

5. Open `/login.html` and register each account. The first account does not have special setup behavior: its role comes from whether its username is in `ADMIN_USERNAMES`.

Users can mark manga viewed or unviewed. That status belongs to the logged-in user and the Filters page can show all, viewed only, or unviewed only.

## Authentication error 10000

If Wrangler reports `Authentication error [code: 10000]` for `/pages/projects/mangacave`, the token in `CLOUDFLARE_API_TOKEN` does not have the required API permissions. The account membership role is separate from token permissions.

Create or edit the token in Cloudflare Dashboard → Profile → API Tokens with:

- Account resource: the account whose ID is in `wrangler.toml` or the Pages project.
- `Account > Cloudflare Pages > Edit`.
- `Account > Account Settings > Read`.

For D1 commands, also grant `Account > D1 > Edit`. The token must be created for the same account that owns the `mangacave` Pages project. Use the token only as an environment secret and never commit it:

```bash
export CLOUDFLARE_API_TOKEN='paste-the-token-in-your-terminal-only'
npx wrangler pages deploy . --project-name mangacave
```

If the project has not been created yet, create it first with the same token:

```bash
npx wrangler pages project create mangacave
```

After creating the project, run the deploy command from your local terminal, not from the Pages build settings. If the command still returns error 10000, the token is either scoped to a different account, has not been replaced in the shell/CI environment, or does not include `Account > Cloudflare Pages > Edit`; the account's Super Administrator membership does not override token permissions.

The D1 binding must be named `DB`, and `database_id` in `wrangler.toml` must be replaced with the real ID returned by `wrangler d1 create`. When using a Pages dashboard build instead of the Wrangler deploy command, configure the same D1 binding and `ADMIN_USERNAMES` variable in the production environment.

After configuring the binding, verify the deployment before testing the custom domain:

```bash
curl -i https://mangacave.pages.dev/api/auth/me
curl -i https://mangacave.pages.dev/api/manga
```

The first request should return `200` with `{"user":null}` for a visitor. The second should return `401` with `Authentication required.`. A `500` with error `1101` means `DB` is still missing from the Pages deployment.

If `mangacave.pages.dev/api/auth/me` returns `200` with `{"user":null}` but `mangacave.pages.dev/api/manga` returns `500`, the Pages Function is deployed but its `DB` binding is missing or the remote schema has not been applied. Add the `DB` binding to the `mangacave` Pages project under both Production and Preview, then run `npx wrangler d1 execute mangacave --remote --file=schema.sql`.

If `mangacave.pages.dev` reaches the function but `mangacave.org` returns `403` with `cf-mitigated: challenge`, Cloudflare is blocking the custom-domain API request before it reaches Pages. Review the custom domain's WAF, Bot Fight Mode, and rate-limit rules, and add an exception/allow rule for the site's `/api/*` paths (at minimum `GET, POST, OPTIONS`) while keeping authentication in the Pages Function. Retest both `/api/auth/me` and `/api/manga` after changing the rule.

For local static preview only:

```bash
python3 -m http.server 4173
```
