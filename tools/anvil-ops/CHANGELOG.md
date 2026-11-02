
## 1.0.7 (unreleased)

- **GSC property sc-domain fallback**: accounts that registered the DOMAIN property (`sc-domain:anvil.wiki`) but not the URL-prefix form (`https://anvil.wiki/`) previously failed doctor/metrics with "not in accessible list" — `resolveGscProperty` now resolves exact → `sc-domain:<host>` → trailing-slash forms, and `createGscClient` memoizes the resolved property for every query. `gsc-access` doctor check reports the resolved property form.
