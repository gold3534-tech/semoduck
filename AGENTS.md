# AGENTS.md

## Project
This project is **세모덕(Semoduck)**, a Korean fandom community platform.

## Product Direction
세모덕 means "세상의 모든 덕질". The app combines fandom communities, goods reviews, exchange/transfer marketplace posts, and external merchandise links.

The main product focus is community-first galleries, merchandise discovery, external purchase links, internal marketplace posts, local LLM-powered tag extraction, no direct payment, and no unauthorized crawling.

## Tech Stack
Frontend:
- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- lucide-react

Backend:
- Next.js Route Handlers
- Supabase Auth and Postgres
- REST-style API endpoints

AI:
- Ollama-compatible local LLM service
- Mock fallback when Ollama is unavailable
- JSON-only AI responses

External Commerce:
- Naver Shopping API abstraction
- Coupang Partners API abstraction
- Mock fallback when API keys are missing
- Official shop links managed manually
- User-submitted links

## Coding Rules
- Use TypeScript strictly.
- Prefer small reusable components.
- Keep API calls in dedicated service files.
- Add loading, error, and empty states.
- Do not hardcode secrets.
- Use `.env.example` for required environment variables.
- Use clear Korean sample data because this service targets Korean users.
- Do not implement real payment, delivery, settlement, or scraping.
- Do not crawl Daangn, Bungaejangter, Joonggonara, or other secondhand marketplaces.
- Use external search links, user submissions, or internal market posts instead.

## MVP Scope
Implement these pages first:
- Home
- Onboarding
- Galleries
- Gallery Detail
- Post Detail
- New Post
- Goods List
- Goods Detail
- Market
- My Page
- Admin

Do not implement a dedicated collection page in this MVP.
