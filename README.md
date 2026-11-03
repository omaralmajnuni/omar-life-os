# Omar Life OS

A personal productivity app that turns a day's tasks, habits and goals into one daily score, then tells you what went well and what to fix tomorrow. I built it for my own routine and use it day to day.

Live demo: https://omar-life-os.vercel.app

## Features

- **Goals, tasks and habits** with progress tracking and an add and edit flow for each goal.
- **Daily score** that combines tasks, habits, a religious-practice score and goal progress into one number.
- **Daily insights and coach card.** Rule-based logic picks the strongest and weakest area of the day and suggests what to focus on tomorrow. It does not call an external AI service.
- **Analytics page** to see how the scores move over time.
- **Onboarding, login, profile and password reset** built on Supabase Auth.
- **Trial and subscription gating.** New users get a trial, and expired trials or subscriptions see a dedicated screen.
- **Admin panel** with a role-based guard and an audit log of admin actions.

## Stack

- Next.js (App Router), React and TypeScript
- Supabase for the database and authentication
- Deployed on Vercel

## Project structure

- `app/` routes: dashboard, goals, analytics, onboarding, profile, login, reset-password, admin
- `components/` goal cards, stat cards, the daily coach card, navigation and the trial and subscription screens
- `hooks/` admin guard, trial status and subscription status
- `lib/` the Supabase client, admin logging and the insights logic
- `supabase/` SQL files for the admin role column and the admin logs table
- `types/` shared TypeScript types

## Run it locally

1. Clone the repository and run `npm install`.
2. Create a Supabase project and add these to a `.env.local` file:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Run the SQL files in the `supabase/` folder in your Supabase SQL editor.
4. Start the app with `npm run dev` and open http://localhost:3000.

## What I learned

Building this end to end taught me how to structure a Next.js app around Supabase auth, how to gate features by trial and subscription state, and how to keep admin actions auditable.
