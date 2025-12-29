# Daily Expense Tracker

A lightweight, browser-based tool to record daily purchases, filter them, and view quick insights with no backend required.

## Features
- Add expenses with date, description, category, payment method, amount, and optional notes.
- Filter by date range, category keyword, or free-text search across descriptions and notes.
- At-a-glance stats for filtered totals, average spend per active day, month-to-date total, and highest-spend category.
- Inline table with badges, notes, and one-click deletion for each entry.
- Data persists locally in your browser via `localStorage` (no sign-in or network dependency).

## Getting started
1. Start a simple static server from the project root:
   ```bash
   python -m http.server 4173 --bind 0.0.0.0
   ```
2. Visit http://localhost:4173 in your browser.
3. Add expenses from the "Log a purchase" form and explore filters/insights.

To clear everything, use the **Clear all** button; it removes all locally stored expenses.
