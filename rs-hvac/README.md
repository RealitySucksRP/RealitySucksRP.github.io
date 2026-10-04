# RS-HVAC interactive preview

Public browser demo of the RS-HVAC v0.25.60 business tablet, published at
https://realitysucksrp.github.io/rs-hvac/.

The twelve menu sections mirror the installed resource's structure and official
RS-HVAC artwork. All people, work orders, prices, balances, stock, qualifications
and transaction results in this demo are sample data. The scenarios and gates are
abbreviated illustrations, not the installed game's complete policy.

The default Senior Technician scenario can accept a service call and finish its
evidence-led walkthrough. Helper includes a fundamentals-to-Apprentice exercise;
Owner includes cash-flow and capital previews. Changing role or selecting Reset
demo clears the session. Reloading also resets it; nothing is stored persistently.

Fleet checkout and inspection, PPE selections, training quizzes, a practice exam,
stock purchases, restocking, a serialized replacement explanation, sample quotes
and company ledger updates all work locally in the browser. Work orders enforce
the sample duty, workwear, fleet and grade checks. Routine sample calls require
the service van. Repair parts are consumed at the repair step; a completed invoice
updates the company ledger once.

No FiveM resource JS/Lua, admin authoring interface, configuration, voice packs,
private state, tokens or game models are included. The public JS is a separate
simulation. A restrictive content security policy disallows network connections.
Links to the catalog and store navigate only when selected by the visitor.

## Local preview

Serve the website repository from a static HTTP server and visit `/rs-hvac/`.
No build step or third-party runtime dependencies are needed. `node --check
rs-hvac/demo.js` checks the JavaScript syntax.

## Assets and verification

The selected field-team artwork, hero images, menu icons and item thumbnails
come from the owner's existing RS-HVAC UI assets. Only selected presentation
assets are copied; original gameplay and NUI files remain separate and unchanged.
`deployment-manifest.json` records SHA-256 hashes of this public page's files.

Browser QA covers all twelve sections, three starting roles and six viewport
widths (320, 390, 768, 1024, 1440 and 1920). Interactive checks cover the service
walkthrough, wrong diagnoses, stock consumption/orders, helper progression,
fleet inspection, exams, capital constraints, filters, reset and dialog dismissal.
The same checks run against the published site after deployment.

Browser verification does not certify FiveM/CEF, OneSync, multiplayer authority,
vehicle physics, world placement, actual settlement or persistence. No resource
restart is needed to use this website demo.
