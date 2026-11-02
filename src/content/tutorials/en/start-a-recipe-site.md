---
title: How to Build a Recipe Site That Wins Google's Recipe Rich Results
description: Build a recipe site with structured recipe data — ingredients, tools, and times as frontmatter, Recipe JSON-LD for rich results, and kitchen-tool affiliate slots.
order: 7
updated: 2026-11-02
tldr: "A recipe site wins when every recipe page speaks Google's language: recipe structured data with ingredients, tools, prep and cook times, so the recipe lands in Google's recipe rich results with ratings and photos right on the search page. Pick one cooking niche, publish tested recipes with a recipe-card format and per-page structured data, and monetize with kitchen-tool affiliate links. The setup CLI scaffolds this as a recipe-hub site."
---

## What makes recipe sites different from other content sites?

Recipes are the most structured content format on the open web. Google does not treat a recipe page as an article — it treats it as an **entity** with required and recommended fields: name, image, ingredients, instructions, cook time, yield. Pages that speak this structured language get **recipe rich results**: star ratings, cook times, and dish photos displayed directly on the search page, above and beside the regular blue links.

That changes the economics. A regular food blog competes on prose and brand; a structured recipe site competes on data completeness. A small site with perfect structured data can outrank a big blog with sloppier markup, because Google can verify every field.

## What does the structured data actually look like?

The core is schema.org's `Recipe` type, emitted as JSON-LD. The fields that matter:

- **Required by Google**: recipe name and at least one image.
- **Recommended (these earn the rich display)**: `recipeIngredient` (the list), `recipeInstructions` (the steps), `prepTime` and `cookTime` in ISO duration format (`PT20M` = 20 minutes), `recipeYield` ("serves 8"), and ratings.
- **Easy to get wrong**: times must be ISO durations, not "about half an hour" — a display string that looks fine on the page is invisible to the validator.

Hand-writing this JSON for every recipe is error-prone; validators fail on a missing comma. The template bakes it in: you fill a `recipe` block in the page's frontmatter (cuisine, servings, prep time, cook time, ingredients, tools) and the **Recipe JSON-LD emits automatically** from those fields, with ISO-shaped times passed through and plain display strings kept off the machine layer.

## How do you pick a niche you can win?

"Recipes" is a red ocean — allrecipes.com and millions of blogs own the head terms. The open ground is niches with structure but weak competition:

- **A cuisine or diet angle**: regional home cooking, high-protein meal prep, air-fryer conversions of classic dishes.
- **A tool angle**: everything for one specific appliance (waffle irons, bread machines) — tool-affiliate intent built in.
- **A constraint angle**: 20-minute weeknight dinners, five-ingredient bakes, dorm-room cooking.

The test from the [tutorial-site playbook](/landing/tutorials/start-a-tutorial-site/) applies: if you can list 20 real questions people ask about your niche, it is deep enough.

## How does the money work?

Recipe sites monetize through **kitchen-tool affiliate links** placed where the intent peaks: the tools list on each recipe page ("the 20 cm tin this cake was tested in"), and a gear page that consolidates reviews. Recipe traffic is cheap to acquire and steady — evergreen dishes get searched year after year — and display advertising layers on top once traffic passes ad-network thresholds. What it does not do is pay overnight: [the monetization ladder](/landing/tutorials/game-wiki-monetization/) runs slower on recipes than on game wiki traffic, in exchange for much longer content shelf life.

## What does the building actually look like?

The same fork-and-answer flow as every site on this template, with the recipe specifics pre-wired: a **recipe frontmatter block** per page (ingredients, tools, times, servings) rendered as a scannable recipe card, Recipe JSON-LD emitted automatically, and a recipes category with its own list page. The setup CLI asks for your site type — **recipe hub** — and scaffolds the whole shape. Write the recipes you have actually cooked, photograph the result, date the page, and the [indexing playbook](/landing/tutorials/get-indexed-by-google/) gets you into the crawl fast.
