# 1. Objective
Design and deliver a production-safe MVP fullstack web app where two friends can add food places, rate meals, leave comments, and view a live ranking board.

# 2. Scope
## 2.1 MVP Features
- Add a new food place.
- Add a food review with rating (1-5) and optional comment.
- Show ranked places by average rating and review count.
- Show recent comments per place.
- Validate all write requests and return consistent API errors.
- Persist data in Supabase Postgres.

## 2.2 Assumptions
- The app is shared by a small trusted group (you + your friend).
- Auth is out of scope for MVP; users enter names manually.
- Server API uses Supabase service role key (server only, never exposed in browser).

## 2.3 User Stories and Acceptance Criteria
1. As a user, I can add a place with name, location, cuisine, and my name.
   - Acceptance: valid submission creates place and appears in ranking board.
2. As a user, I can review a place with food name, rating, comment, and my name.
   - Acceptance: valid review updates ranking and recent comments.
3. As a user, I can see top places sorted by score.
   - Acceptance: sort order is average rating desc, then review count desc.
4. As a user, I can understand errors quickly.
   - Acceptance: validation and server errors show readable messages in UI.

# 3. Architecture Specification
## 3.1 Service Responsibility Map
- Next.js App Router (`src/app`): web UI and API routes.
- API Layer (`src/app/api/*`): validation, rate limiting, error mapping, contract enforcement.
- Domain Layer (`src/lib/*`): schemas, ranking logic, repository, HTTP response helpers.
- Data Layer (Supabase Postgres): persistence, constraints, indexes, view.

## 3.2 API Endpoint Spec
### `GET /api/places`
- Purpose: list places with ranking stats + latest reviews.
- Response `200`:
```json
{
  "success": true,
  "data": {
    "places": []
  }
}
```

### `POST /api/places`
- Purpose: create place.
- Request:
```json
{
  "name": "Taco Corner",
  "location": "Main Street",
  "cuisine": "Mexican",
  "addedBy": "Vinsx"
}
```
- Success `201`:
```json
{
  "success": true,
  "data": {
    "place": {}
  }
}
```

### `GET /api/places/:placeId`
- Purpose: fetch single place with all reviews.
- Success `200`:
```json
{
  "success": true,
  "data": {
    "place": {}
  }
}
```

### `POST /api/reviews`
- Purpose: create a review.
- Request:
```json
{
  "placeId": "11111111-1111-4111-8111-111111111111",
  "foodName": "Beef Ramen",
  "rating": 5,
  "comment": "Rich broth and perfect noodles.",
  "reviewerName": "Friend"
}
```
- Success `201`:
```json
{
  "success": true,
  "data": {
    "review": {}
  }
}
```

## 3.3 Validation and Error Model
- Validation library: `zod`.
- Write abuse control: in-memory per-IP rate limiter.
- Standard error envelope:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed.",
    "details": []
  }
}
```
- Error codes used:
  - `VALIDATION_ERROR` (`422`)
  - `BAD_REQUEST` (`400`)
  - `RATE_LIMITED` (`429`)
  - `NOT_FOUND` (`404`)
  - `CONFLICT` (`409`)
  - `INTERNAL_ERROR` (`500`)

# 4. Data Model and Persistence Logic
## 4.1 Database Schema
- `places`
  - `id uuid pk`
  - `name text not null`
  - `location text not null`
  - `cuisine text null`
  - `added_by text not null`
  - `created_at timestamptz default now()`
- `reviews`
  - `id uuid pk`
  - `place_id uuid fk -> places(id) on delete cascade`
  - `food_name text not null`
  - `rating smallint check 1..5`
  - `comment text null`
  - `reviewer_name text not null`
  - `created_at timestamptz default now()`
- `place_rankings` view for aggregate leaderboard queries.

## 4.2 Constraints and Indexing
- Unique dedupe: `lower(name), lower(location)` on places.
- Check constraints on text lengths and rating range.
- Indexes:
  - `places_created_at_idx`
  - `reviews_place_id_idx`
  - `reviews_created_at_idx`

## 4.3 Migration Strategy
- Initial migration file:
  - `supabase/migrations/202603160001_initial_schema.sql`
- Seed file:
  - `supabase/seed.sql`

# 5. Product Flows and UX Behavior
## 5.1 User Flow Spec
1. Open dashboard.
2. Add a place from left panel.
3. Add a review from left panel.
4. Ranking board refreshes and highlights updated place.
5. Read recent comments for each place.

## 5.2 UI State Map
- Loading state: skeleton cards while places load.
- Empty state: call-to-action when zero places exist.
- Error state: inline red banner in forms and board section.
- Success state: inline success message after creates.
- Disabled state: review form disabled when no places exist.

## 5.3 Accessibility and Responsiveness Checklist
- Semantic labels and form controls.
- Keyboard-focusable buttons/inputs/selects.
- Readable color contrast on alerts and controls.
- `aria-live="polite"` in ranking section for updates.
- Mobile-first layout with responsive two-column switch at `lg`.

# 6. QA, Testing, and Controls
## 6.1 Automated Test Cases
- `src/lib/schemas.test.ts`
  - Valid and invalid place input.
  - Rating coercion and bounds validation.
- `src/lib/ranking.test.ts`
  - Average score calculation.
  - Ranking sort tie-break logic.
- `src/app/api/places/route.test.ts`
  - `GET` success path.
  - `POST` validation failure.
  - `POST` creation success.
- `src/app/api/reviews/route.test.ts`
  - Validation failure for rating out of bounds.
  - `POST` creation success.

## 6.2 CI/Check Pipeline Checklist
- Install: `npm ci`
- Lint: `npm run lint`
- Type check: `npm run typecheck`
- Tests: `npm run test`
- Build: `npm run build`
- Workflow file: `.github/workflows/ci.yml`

# 7. Security, Deployment, Rollback, Monitoring
## 7.1 Security Controls
- Server-only Supabase service role key.
- Strict request validation with zod.
- DB constraints to enforce integrity.
- RLS enabled on tables.
- Rate limiting on write endpoints.

## 7.2 Deployment Runbook
1. Provision Supabase project.
2. Run migration SQL and seed SQL.
3. Set env vars in deployment platform:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy app (`vercel` or any Node host).
5. Run post-deploy checks:
   - Load homepage.
   - Add place and review.
   - Confirm leaderboard updates.

## 7.3 Rollback Runbook
1. Revert deployment to previous successful build.
2. If migration caused issue, run compensating SQL migration (do not drop production data blindly).
3. Re-run smoke tests on rollback version.

## 7.4 Monitoring Suggestions
- Track API route status codes and latency.
- Alert on sustained `5xx` spikes.
- Log validation error trends to detect abuse patterns.

# 8. Project File Tree
```text
food-ranker/
|- .env.example
|- .eslintrc.json
|- .github/workflows/ci.yml
|- next.config.mjs
|- package.json
|- postcss.config.mjs
|- tailwind.config.ts
|- tsconfig.json
|- vitest.config.mts
|- vitest.setup.ts
|- supabase/
|  |- migrations/202603160001_initial_schema.sql
|  `- seed.sql
`- src/
   |- app/
   |  |- api/
   |  |  |- places/
   |  |  |  |- route.ts
   |  |  |  |- route.test.ts
   |  |  |  `- [placeId]/route.ts
   |  |  `- reviews/
   |  |     |- route.ts
   |  |     `- route.test.ts
   |  |- globals.css
   |  |- layout.tsx
   |  `- page.tsx
   |- components/
   |  |- add-place-form.tsx
   |  |- add-review-form.tsx
   |  |- place-card.tsx
   |  `- places-dashboard.tsx
   `- lib/
      |- env.ts
      |- http.ts
      |- ranking.test.ts
      |- ranking.ts
      |- rate-limit.ts
      |- repository.ts
      |- schemas.test.ts
      |- schemas.ts
      |- supabase-admin.ts
      `- types.ts
```

# 9. Installation and Run Commands
```bash
npm install
cp .env.example .env.local
# Fill SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
npm run dev
```

# 10. Verification Steps
```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Manual verification:
1. Open `http://localhost:3000`.
2. Add a place.
3. Add a review for that place.
4. Confirm ranking board updates and shows latest comments.
