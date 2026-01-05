# Planned Tasks

## Next Up
- [ ] **Favorites & Price Alerts** (requires careful planning)
  - [ ] "Save to favorites" button on product pages
  - [ ] Favorites list in popup
  - [ ] Background price check (every 6 hours, max 5 products)
  - [ ] Browser notification when price drops
  - [ ] Auto-cleanup: remove products not viewed in 7 days

## Future Ideas
- [ ] Browser action with manual search input
- [ ] Price history graph (if we find a data source)
- [ ] Export favorites to CSV

## Anti-Ban Strategy for Price Alerts
> ⚠️ Must implement carefully to avoid Akakçe bans

| Rule | Reason |
|------|--------|
| Max 5 products per 6 hours | Limit request volume |
| Random delay 5-15 min between checks | Avoid pattern detection |
| Use user's real browser session | No suspicious headers |
| Auto-remove stale products | Reduce unnecessary checks |
