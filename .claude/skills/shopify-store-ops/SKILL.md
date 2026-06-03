---
name: shopify-store-ops
description: Use when managing the thementalsport.com Shopify store — creating or updating products, organizing collections, checking orders/customers, setting inventory, running sales analytics, or creating discounts via the Shopify MCP tools.
---

# Shopify Store Ops

## Overview

thementalsport.com is run through the **Shopify Admin MCP** (tool prefix `mcp__…__`, the Shopify connector). There is no store config in this repo — all reads and writes go through MCP tools live against the real store. Treat every write as production.

**Core principle:** Reads are safe to run freely. Writes (create/update product, set inventory, create discount, bulk status change) change the live storefront — confirm intent with the user first.

## Tool Map

| Need | Tool |
|---|---|
| Store identity / currency / domain | `get-shop-info` |
| Find products | `search_products` / `get-product` |
| Create / edit product | `create-product` / `update-product` |
| Publish/unpublish many at once | `bulk-update-product-status` |
| Collections | `search_collections`, `get-collection`, `create-collection`, `update-collection`, `add-to-collection` |
| Orders | `list-orders`, `get-order` |
| Customers | `list-customers` |
| Inventory | `get-inventory-levels`, `set-inventory` |
| Sales analytics (ShopifyQL) | `run-analytics-query` |
| Discount codes | `create-discount` |
| Anything without a built-in tool | `graphql_query` (read) / `graphql_mutation` (write) |

## Decision Rule

1. Built-in tool exists → use it (structured output + widgets, better UX).
2. No built-in tool (gift cards, metafields, pages, markets, translations…) → `graphql_query` / `graphql_mutation`. Use `graphql_schema` + `validate_graphql_codeblocks` to build correct operations. **Never** tell the user data is unavailable just because there's no dedicated tool.

## Analytics (ShopifyQL)

Use `run-analytics-query` for sales/order/product performance. Always state the date range you queried — Shopify defaults can mislead. For "this month revenue" type asks, set an explicit range rather than relying on defaults.

## Safety

- **Confirm before writes** — especially `bulk-update-product-status` (can hide every product) and `create-discount` (live, redeemable money off).
- **Verify the target first** — `get-product`/`get-collection` before updating, so you're editing what you think you are.
- Inventory writes are per-location: `set-inventory` needs the right location id from `get-inventory-levels`.

## Common Mistakes

- Quoting revenue without naming the date window → ambiguous/wrong.
- Creating a duplicate collection instead of `search_collections` first.
- Forgetting `graphql_query` exists and declaring something impossible.
