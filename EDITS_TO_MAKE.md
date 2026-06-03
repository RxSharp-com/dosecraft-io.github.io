# Two edits to make when pasting InfusionArcade.jsx into game.html

## Edit 1 — Remove the import lines (top of file)
Delete these 4 lines entirely:

    import { useState, useEffect, useRef, useCallback } from "react";

(The CDN version of React already provides these. The <script> block above
your paste declares them for you.)

---

## Edit 2 — Change the function signature to accept initialDrug
Find this line (near line 294 in your original file):

    export default function InfusionArcade() {

Replace it with:

    function InfusionArcade({ initialDrug = null }) {

Then, just inside that function, after the line:
    const [screen, setScreen] = useState("menu");

Add this block:

    // Auto-select drug if one was passed from the homepage URL
    useEffect(() => {
      if (initialDrug) {
        const idx = DRUGS.findIndex(d => d.name === initialDrug);
        if (idx !== -1) startDrug(idx);
      }
    }, [initialDrug]);

NOTE: Because startDrug uses useCallback and references showSplashThen,
place this useEffect *after* the startDrug declaration in your file
(around line 362). The linter/Babel won't care about order here.

---

## That's it. No other changes needed.

The homepage (index.html) passes ?drug=Zosyn in the URL.
game.html reads it, finds the matching index in DRUGS[], and calls startDrug().
