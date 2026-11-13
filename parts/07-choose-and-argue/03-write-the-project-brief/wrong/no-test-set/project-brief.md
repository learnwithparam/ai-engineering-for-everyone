# Project brief: reading admissions forms with AI

## Problem and cost today

Each season, three people read 1,200 forms by hand and type each one into the register. One wrong field can give a place to the wrong child and lead to an appeal.

## Source of truth

The register, `register.json`, and the 2027 admissions policy. The AI never changes the register. A person does.

## What AI does

It reads each form and fills one row: name, date of birth, sibling, distance, care status, EHCP and preference. It drafts the letters.

## What a person does

The admissions officer checks every row the AI flags, approves every offer, and signs every letter. The rules in clause 4 set the order, not the AI.

## Cost estimate

- Runs in a season: 1,200
- Input tokens per run: 2,402 (one form plus the whole policy)
- Output tokens per run: 300
- Model: Sonnet
- Cost: $9.36 a season

## How we will measure it

We will ask the office staff if they like it after the season.

## Guardrails

Form text is data, never instructions. The AI never decides, never uses religion, race, sex or disability, and never sees email addresses. Forms with orders to the AI go to a person.

## Model choice

Sonnet. It got 42 of 42 fields right on our six test forms. Haiku got 39. The extra cost is about $8.89 a season.
