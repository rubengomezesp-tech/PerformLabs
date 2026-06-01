-- Move the unaccent extension out of the public schema (security advisor 0014,
-- extension_in_public). Verified that nothing references unaccent() — no user
-- functions, indexes, generated columns, or application queries — so relocating
-- it is safe. The extensions schema is already on the default search_path, so any
-- future unqualified unaccent() call still resolves.
create schema if not exists extensions;
alter extension unaccent set schema extensions;
