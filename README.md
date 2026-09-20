# Uni_signal_week1
# MangaCave

## Cloudflare Pages + D1

This project uses Cloudflare Pages Functions and D1 for real shared accounts and manga data.

1. Install Wrangler and authenticate:

	```bash
	npm install --save-dev wrangler
	npx wrangler login
	```

2. Create the database and copy its ID into `wrangler.toml`:

	```bash
	npx wrangler d1 create mangacave
	npx wrangler d1 execute mangacave --remote --file=schema.sql
	```

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

If this repository is connected to Cloudflare Pages, do **not** set `npx wrangler pages deploy ...` as the Pages build command. Cloudflare Pages is already the deploy system; that command would make the build try to deploy the same project again and requires a second API call with a token.

Use these Pages build settings instead:

- Build command: leave empty.
- Build output directory: `.`
- Root directory: `/` (the repository root).

Pages will publish the static files and detect the `functions/` directory. In **Settings → Functions**, add the D1 binding `DB` for both Production and Preview if needed. Add `ADMIN_USERNAMES` as an environment variable for the same environments. No Cloudflare API token is needed in the Pages build environment.

Use `npx wrangler pages deploy . --project-name mangacave` only from a local terminal or an external CI workflow, never as the build command of the same Pages project.

5. Open `/login.html` and register each account. The first account does not have special setup behavior: its role comes from whether its username is in `ADMIN_USERNAMES`.

Users can mark manga viewed or unviewed. That status belongs to the logged-in user and the Filters page can show all, viewed only, or unviewed only.

## Authentication error 10000

If Wrangler reports `Authentication error [code: 10000]` for `/pages/projects/mangacave`, the token in `CLOUDFLARE_API_TOKEN` does not have the required API permissions. The account membership role is separate from token permissions.

Create or edit the token in Cloudflare Dashboard → Profile → API Tokens with:

- Account resource: the account whose ID is in `wrangler.toml` or the Pages project.
- `Account > Cloudflare Pages > Edit`.
- `Account > Account Settings > Read`.

For D1 commands, also grant `Account > D1 > Edit`. Use the token only as an environment secret and never commit it:

```bash
export CLOUDFLARE_API_TOKEN='paste-the-token-in-your-terminal-only'
npx wrangler pages deploy . --project-name mangacave
```

If the project has not been created yet, create it first with the same token:

```bash
npx wrangler pages project create mangacave
```

The D1 binding must be named `DB`, and `database_id` in `wrangler.toml` must be replaced with the real ID returned by `wrangler d1 create`. When using a Pages dashboard build instead of the Wrangler deploy command, configure the same D1 binding and `ADMIN_USERNAMES` variable in the production environment.

For local static preview only:

```bash
python3 -m http.server 4173
```
