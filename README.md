# Uni_signal_week1
# MangaShelf

## Cloudflare Pages + D1

This project now uses Cloudflare Pages Functions and D1 for real shared accounts and manga data.

1. Install Wrangler and authenticate:

	```bash
	npm install --save-dev wrangler
	npx wrangler login
	```

2. Create the database and copy its ID into `wrangler.toml`:

	```bash
	npx wrangler d1 create mangashelf
	npx wrangler d1 execute mangashelf --remote --file=schema.sql
	```

3. Set the allowed administrator usernames in `wrangler.toml`, for example:

	```toml
	ADMIN_USERNAMES = "lucia,editor2"
	```

	These names are case-insensitive. Users with those names become admins when they register; every other unique username is view-only.

4. Deploy the Pages site from this folder:

	```bash
	npx wrangler pages deploy .
	```

	In Cloudflare Pages, set the D1 binding named `DB` and the `ADMIN_USERNAMES` variable for the production environment as well.

5. Open `/login.html` and register each account. The first account does not have special setup behavior: its role comes from whether its username is in `ADMIN_USERNAMES`.

Users can mark manga viewed or unviewed. That status belongs to the logged-in user and the Filters page can show all, viewed only, or unviewed only.

For local static preview only:

```bash
python3 -m http.server 4173
```
