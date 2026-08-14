# Brand assets

## avatar.png (or .jpg)

The headshot used on the white quote cards (`scripts/blog/quotecard.mjs`).

Drop a photo here named exactly `avatar.png` or `avatar.jpg` and it is picked up
automatically on the next generation run. Until one exists, a monogram circle
("GN") is drawn instead.

Guidelines:
- Square-ish crop centred on the face works best (it is masked to a circle).
- 500x500 or larger.
- If the face is not centred, set `avatarFocusY` when calling `renderQuoteCard`
  (0 = top of the image, 0.5 = centre, 1 = bottom) to shift the crop.
