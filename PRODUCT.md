# The Wall

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Visitors who want to explore a shared community wall and leave a short message, drawing, or signature. Moderators review reports and remove harmful contributions.

## Product Purpose

A welcoming shared canvas for small acts of expression and connection. Visitors can explore, choose a location, preview their contribution, and publish it for others to discover.

## Operating Context

The wall fills the viewport and supports mouse, touch, pen, wheel, and keyboard exploration. Visitors contribute anonymously, with an optional display name. Real visitor contributions are stored in PostgreSQL and separated from curated artwork. Published marks use world coordinates.

## Capabilities and Constraints

React, TypeScript, Vite, Express, and PostgreSQL. Vercel hosts the app and API; Neon provides shared persistence. Drafts survive failed publishing and reloads in local browser storage. Text is limited to 120 characters, names to 30. Drawings have bounded stroke and point data. Publishing is immediate, rate-limited, and reportable. Owners can remove their contributions using an anonymous ownership cookie. No fabricated visitor content or testimonials.

## Brand Commitments

Keep the existing starting mural and warm textured plaster wall. Tyrian purple is the interface accent. Inter is used for interface text; wall lettering remains expressive. All interface icons use Phosphor. Corners are rounded. Zoom and home controls are centered along the bottom; Add a mark is at the bottom right. The user has authorized an interface redesign and wants a more expressive, playful experience.

## Evidence on Hand

The working app and existing assets in public/assets. Browser and API verification scripts in scripts/. No new factual claims, testimonials, or visitor stories may be invented.

## Product Principles

- The wall is the experience; interface controls give it room.
- Make contribution approachable and forgiving.
- Preserve placement and drafts through errors.
- Use playful feedback without moving content people are reading or drawing.

## Accessibility & Inclusion

Keyboard exploration and explicit Add a mark controls; text as an alternative to drawing; labeled controls; native modal focus management and Escape dismissal; contribution list alternative to spatial navigation; touch-friendly controls and reduced-motion support.
