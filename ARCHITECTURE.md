# LocoLive — Architecture Document

> New developer onboarding guide. Read this first.

---

## 1. Project Overview

LocoLive is a **location-based social discovery platform**. Users share ephemeral stories, posts, and reels tied to their real-world location. The app detects when two users cross paths ("crossings") and enables chat, follows, and notifications around shared physical spaces.

Built as a **monolith** (Go backend + React SPA frontend). Scales to ~10K users on a single VPS with PostgreSQL + Redis.

---

## 2. Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React 19 + TypeScript + Vite | SPA with PWA support |
| Styling | Tailwind CSS v4 + `tailwind-merge` + `clsx` | Utility-first CSS |
| Backend | Go 1.24 + Gin web framework | REST API + WebSocket |
| Database | PostgreSQL 16 + PostGIS | Relational + spatial queries |
| ORM/Queries | sqlc (code-gen from raw SQL) | Type-safe SQL |
| Cache | Redis 7 | Token blacklist, rate limiting, pub/sub |
| Auth | JWT (custom) + Google OAuth + Firebase Phone OTP | 3 auth methods |
| Storage | Cloudflare R2 (S3-compatible) with local fallback | Media uploads |
| Real-time | Gorilla WebSocket + Redis pub/sub | Chat + notifications |
| Maps | Leaflet (OSM) + Mapbox GL | Location UI |
| Icons | Lucide React | Icon set |
| Animations | Framer Motion | UI animations |
| Charts | Recharts | Admin analytics |
| Notifications | Firebase Cloud Messaging (FCM) | Push notifications |
| Logging | zerolog (structured JSON) | Backend logging |
| PWA | vite-plugin-pwa + Workbox | Offline support |

---

## 3. Project Structure

```
D:\locolive\
├── ARCHITECTURE.md              ← You are here
├── DEPLOYMENT_PLAN.md           ← Deployment guide
├── static/                      ← GoogleSans fonts (TTF)
│
├── backend/
│   └── locolive-backend-main/   ← Go backend (submodule)
│       ├── cmd/server/main.go   ← Entry point, DI, graceful shutdown
│       ├── internal/
│       │   ├── api/             ← ROUTERS + HANDLERS (51 files)
│       │   │   ├── router.go        → All route definitions
│       │   │   ├── middleware.go     → Auth, admin, activation, CORS, rate-limit
│       │   │   ├── auth_password.go  → Login, signup, forgot/reset password
│       │   │   ├── auth_google.go    → Google OAuth
│       │   │   ├── auth_verification.go → Email/phone OTP verify
│       │   │   ├── user.go          → User CRUD, profile
│       │   │   ├── profile.go       → Profile update
│       │   │   ├── story.go         → Stories CRUD
│       │   │   ├── post.go          → Posts CRUD
│       │   │   ├── reels.go         → Reels CRUD
│       │   │   ├── chat_*.go        → Chat HTTP + WebSocket
│       │   │   ├── connection.go    → Follow/unfollow
│       │   │   ├── location.go      → Location ping, heatmap
│       │   │   ├── admin.go         → Admin dashboard
│       │   │   ├── upload.go        → File upload + image processing
│       │   │   ├── rate_limit.go    → Rate limiter factory
│       │   │   ├── error.go         → Error response helpers
│       │   │   └── server.go        → Server struct + DI wiring
│       │   ├── config/config.go     ← Env config via viper
│       │   ├── repository/          ← DATABASE LAYER
│       │   │   ├── store.go             → Store interface + wrapper
│       │   │   ├── db/                  → sqlc-generated Go code (≈33 query files)
│       │   │   └── mock/               → Generated mocks for testing
│       │   ├── service/             ← BUSINESS LOGIC
│       │   │   ├── user/service.go      → User creation, validation
│       │   │   ├── story/story.go       → Feed queries, cascading radius
│       │   │   ├── privacy/             → Privacy checks, audit logs
│       │   │   ├── notification/        → FCM push notifications
│       │   │   ├── location/            → Redis geo + geohash
│       │   │   ├── moderation/          → Text content flagging
│       │   │   ├── safety/              → Panic mode, blocks
│       │   │   ├── storage/             → R2 S3 + local file storage
│       │   │   ├── admin/               → Admin business logic
│       │   │   └── username/            → Username reservation
│       │   ├── realtime/            ← WebSocket hub (chat)
│       │   │   ├── hub.go
│       │   │   └── client.go
│       │   ├── token/               ← JWT maker + payload
│       │   ├── worker/              ← BACKGROUND JOBS
│       │   │   ├── crossing.go          → Path crossing detection (every 5m)
│       │   │   ├── cleanup.go           → Expired data cleanup
│       │   │   └── data_export.go       → Async GDPR data export
│       │   └── util/                 ← HELPERS
│       │       ├── password.go          → bcrypt hash/check
│       │       ├── mail.go              → SMTP email sender
│       │       ├── sms.go               → SMS sender
│       │       ├── firebase_auth.go     → Firebase admin SDK
│       │       └── phone_validation.go  → E.164 normalization + Twilio lookup
│       ├── db/
│       │   ├── migrations/          ← 53 SQL migration pairs (up/down)
│       │   └── query/               ← 33 hand-written .sql files (sqlc input)
│       ├── sqlc.yaml                ← sqlc code-gen config
│       ├── Makefile                 ← Build/test/redeploy commands
│       ├── nginx-*.conf             ← Nginx config (2 files)
│       ├── locolive-api.service     ← systemd unit
│       └── app.env.example          ← Environment template
│
└── frontend/
    └── frontend/                   ← React frontend (submodule)
        ├── src/
        │   ├── main.tsx                ← Entry point + root render
        │   ├── App.tsx                 ← Routes + error boundary
        │   ├── index.css               ← Tailwind imports + globals
        │   ├── components/
        │   │   ├── ui/                 ← Design system (Button, Input, Modal, Loader, etc.)
        │   │   ├── layout/             ← Sidebar, RightSidebar, UserSearch
        │   │   ├── auth/               ← ProtectedRoute, PublicRoute, VerificationWizard
        │   │   ├── chat/               ← ChatBox, ChatList, ChatWindow, MessageItem
        │   │   ├── story/              ← StoryBar, StoryViewer, CreateStoryModal
        │   │   ├── reels/              ← ReelItem, ReelsView, ActionBar, CreateReelModal
        │   │   ├── post/               ← PostCard, CreatePostModal, PostInputBox
        │   │   ├── profile/            ← EditProfileModal, Highlights, ProfileQR
        │   │   ├── settings/           ← 8 setting sections
        │   │   ├── map/                ← MapView, Heatmap, Marker
        │   │   ├── discovery/          ← DiscoveryPanel, PeopleNearbyCard
        │   │   ├── explore/            ← ExploreFeed + sub-feeds
        │   │   ├── casting/            ← CastingCard, CastingGrid
        │   │   ├── share/              ← ShareModal
        │   │   └── admin/              ← AdminHeader, UserTable, StatsCard, etc.
        │   ├── pages/
        │   │   ├── dashboard/          ← Main app (Dashboard, Profile, Feed, Map, Chat)
        │   │   ├── auth/               ← Login, Signup, Verify, ForgotPassword
        │   │   ├── admin/              ← Admin panel pages
        │   │   ├── CreatePost.tsx
        │   │   ├── NotFound.tsx
        │   │   └── Offline.tsx
        │   ├── hooks/                  ← Custom hooks (useAuth, useChat, useGeolocation, etc.)
        │   ├── context/                ← React contexts (Auth, Theme, Network, Sound)
        │   ├── services/               ← API client (axios), Firebase, auth, chat, map services
        │   ├── store/                  ← Zustand stores (authStore, adminStore)
        │   ├── types/                  ← TypeScript interfaces
        │   └── utils/                  ← Helpers (media URLs, formatters, logger)
        ├── public/                     ← Static assets
        ├── dist/                       ← Build output
        ├── vite.config.ts              ← Vite config + PWA + code splitting
        └── package.json
```

---

## 4. Local Setup Guide

### Backend (Go)

**Prerequisites:**
- Go 1.24+
- PostgreSQL 16+ with PostGIS extension
- Redis 7+
- Node.js 20+ (for frontend)

**Steps:**

```bash
# 1. Create database
psql -U postgres -c "CREATE DATABASE privacy_social;"
psql -U postgres -d privacy_social -c "CREATE EXTENSION IF NOT EXISTS postgis;"

# 2. Run migrations (up scripts in db/migrations/)
# Apply all up migrations in order:
for f in db/migrations/*.up.sql; do
  psql -U postgres -d privacy_social -f "$f"
done

# 3. Copy env and configure
cp app.env.example app.env
# Edit app.env — set DB_SOURCE, REDIS_ADDRESS, JWT_SECRET, etc.

# 4. Start Redis
redis-server

# 5. Run backend
go run cmd/server/main.go
# Server starts at :8080
```

**Optional — Regenerate sqlc code:**
```bash
sqlc generate   # Reads sqlc.yaml, outputs to internal/repository/db/
```

### Frontend (React)

```bash
# 1. Install dependencies
npm install

# 2. Copy env
cp .env.example .env
# Edit VITE_API_URL if needed (default: http://localhost:8080)

# 3. Start dev server
npm run dev
# Dev server at :5173, proxies API to :8080
```

### Docker (if configured)
```bash
# From root
docker-compose up --build -d
```

---

## 5. Request Flow

```
┌─────────────┐     ┌──────────────┐     ┌───────────────────┐
│  Browser     │     │   Nginx      │     │   Go Server       │
│  (React SPA) │────▶│  :80 / :443  │────▶│   :8080           │
│  :5173 (dev) │     │              │     │                   │
└─────────────┘     └──────────────┘     ───────┬────────────┘
                                                │
                    ┌───────────────────────────┼───────────────┐
                    │                           │               │
                    ▼                           ▼               ▼
            ┌──────────────┐          ┌──────────────┐   ┌──────────┐
            │  Public      │          │  Protected   │   │ WebSocket│
            │  Routes      │          │  Routes      │   │ /ws/chat │
            │              │          │              │   │          │
            │ /health      │          │ authMiddleware│   │ Gorilla  │
            │ /users/login │          │      │       │   │ WS +     │
            │ /users       │          │      ▼       │   │ Redis    │
            │ /auth/google │          │ activationM  │   │ pub/sub  │
            └──────────────┘          │      │       │   └──────────┘
                                      │      ▼       │
                                      │  Handler     │
                                      │      │       │
                                      │      ▼       │
                                      │  Service     │
                                      │  (business   │
                                      │   logic)     │
                                      │      │       │
                                      │      ▼       │
                                      │  sqlc Query  │
                                      │      │       │
                                      │      ▼       │
                                      │  PostgreSQL  │
                                      └──────────────┘
```

### Middleware Chain (Protected Route)

```
Request → requestIDMiddleware() → loggerMiddleware() → gin.Recovery()
       → corsMiddleware() → securityHeadersMiddleware() → gzip
       → generalRateLimiter() → authMiddleware()
       → [activationMiddleware()] → Handler
```

- `authMiddleware()`: Extracts JWT from HttpOnly cookie or `Authorization: Bearer <token>` header. Sets `authPayload` in context.
- `activationMiddleware()`: Checks `is_email_verified` / `is_phone_verified`. Required for most data-access routes.
- Rate limiters: Applied per-route group (auth, search, location, etc.).

---

## 6. Auth Flow

### Registration

```
POST /api/users
  │
  ├── Validate input (Gin binding)
  ├── Block disposable emails
  ├── Normalize phone to E.164: "9999999999" → "+919999999999"
  ├── Validate username (3-20 chars, alphanumeric + underscore)
  ├── Hash password (bcrypt)
  ├── Insert user into DB
  ├── Create session (refresh token)
  ├── Set HttpOnly cookies: access_token + refresh_token
  └── Return JWT pair + user object
```

### Login

```
POST /api/users/login
  │
  ├── Find user by phone/email
  ├── bcrypt.CompareHashAndPassword()
  ├── Create session → DB
  ├── Set cookies:
  │   access_token:  JWT, path="/",  maxAge=15m, HttpOnly, SameSite=Lax
  │   refresh_token: JWT, path="/api/users/renew-access", maxAge=90d, HttpOnly
  └── Response: { session_id, access_token, refresh_token, user }
```

### Token Refresh

```
POST /api/users/renew-access
  │
  ├── Read refresh_token from cookie OR request body
  ├── Verify JWT signature
  ├── Check session exists in DB + not blocked
  ├── Check Redis blacklist (revoke_all:<user_id>)
  ├── Issue new JWT pair
  └── Response: { access_token, refresh_token }
```

### Token Blacklisting

```
logout:           → Redis SET blacklist:<token_id> = "revoked" TTL=until expiry
logout-all:       → Redis SET revoke_all:<user_id> = timestamp TTL=24h
password-change:  → Revoke current token
```

On every request, `authMiddleware()` checks:
1. JWT not expired
2. Token ID not in Redis blacklist
3. `revoke_all` timestamp < token's `issued_at`

---

## 7. Key Data Models

### `users`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| phone | VARCHAR(20) | E.164 format, unique |
| email | VARCHAR | Nullable, unique |
| username | VARCHAR(30) | Unique, lowercase |
| password_hash | TEXT | bcrypt |
| role | ENUM | `user`, `moderator`, `admin` |
| is_verified | BOOL | Email + phone verified |
| is_ghost_mode | BOOL | Hide location from others |
| is_private | BOOL | Require follow to see content |
| is_shadow_banned | BOOL | Hidden from discovery |
| last_active_at | TIMESTAMPTZ | For "active now" indicators |

### `stories`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| user_id | UUID | FK → users |
| media_url | TEXT | Image/video URL |
| geom | GEOMETRY(Point, 4326) | PostGIS point |
| geohash | VARCHAR | Denormalized for fast lookup |
| expires_at | TIMESTAMPTZ | Auto-delete after 24h |
| visibility | ENUM | `public`, `connections`, `close_friends` |

### `locations`
| Column | Type | Notes |
|--------|------|-------|
| user_id | UUID | FK → users |
| geom | GEOMETRY(Point, 4326) | Current location |
| geohash | VARCHAR | For proximity joins |
| time_bucket | TIMESTAMPTZ | Rounded to 5m intervals |
| expires_at | TIMESTAMPTZ | Auto-expire (TTL) |

### `connections`
| Column | Type | Notes |
|--------|------|-------|
| requester_id | UUID | FK → users |
| target_id | UUID | FK → users |
| status | ENUM | `pending`, `accepted`, `blocked` |

### `crossings`
| Column | Type | Notes |
|--------|------|-------|
| user_id_1 | UUID | FK → users |
| user_id_2 | UUID | FK → users |
| location_center | GEOGRAPHY | Midpoint of crossing |
| occurred_at | TIMESTAMPTZ | When detected |

### `messages`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| sender_id | UUID | FK → users |
| receiver_id | UUID | Nullable (if not group) |
| group_id | UUID | Nullable (if group chat) |
| content | TEXT |
| is_read | BOOL |
| expires_at | TIMESTAMPTZ | For ephemeral messages |

### ER Relationship
```
users (1) ────< stories (N)       [user has many stories]
users (1) ────< posts (N)
users (1) ────< reels (N)
users (1) ────< locations (N)     [periodic location pings]
users (1) ────< connections (N)   [follows/unfollows]
users (N) ────< crossings (N)     [N:M via crossing pairs]
users (1) ────< messages (N)      [as sender or receiver]
users (1) ────< notifications (N)
users (1) ────< sessions (N)      [refresh token sessions]
```

---

## 8. API Reference

### Auth

```
POST /api/users                      → Register new user
  Body: { username, password, phone, email, full_name }
  Response 201: { session_id, access_token, refresh_token, user }

POST /api/users/login                → Login
  Body: { phone, password }
  Response 200: { session_id, access_token, refresh_token, user }

POST /api/users/renew-access         → Refresh tokens
  Cookie: refresh_token
  Response 200: { access_token, refresh_token }

POST /api/auth/google                → Google OAuth login
  Body: { id_token } or { access_token } or { authorization_code, redirect_uri }
  Response 200: { session_id, access_token, refresh_token, user }

POST /api/auth/forgot-password       → Request password reset email
  Body: { email }
  Response 200: { message }

POST /api/auth/reset-password        → Reset password with token
  Body: { token, new_password }
  Response 200: { message }

POST /api/auth/verify-email          → Verify email with OTP
  Body: { email, otp }
  Response 200: { message }

POST /api/auth/verify-firebase-phone → Verify phone with Firebase OTP
  Body: { verification_id, code }
  Response 200: { message }
```

### Profile

```
GET  /api/profile/me                 → Get my profile
  Response 200: { id, username, avatar_url, bio, connections_count, ... }

PUT  /api/profile                    → Update profile
  Body: { full_name?, bio?, avatar_url?, theme?, links? }
  Response 200: { updated user }

GET  /api/users/:id                  → Get another user's profile (privacy-gated)
  Response 200: { id, username, avatar_url, is_private, ... }

POST /api/users/reserve-username     → Reserve a username
  Body: { username }
  Response 200: { reserved: true }

PUT  /api/users/change-username      → Change username
  Body: { new_username }
  Response 200: { user }
```

### Feed & Stories

```
GET  /api/feed                       → Main feed (cascading radius)
  Query: lat, lng
  Response 200: [{ story_id, media_url, username, ... }]

GET  /api/stories/map                → Stories within map bounds
  Query: west, south, east, north
  Response 200: [{ story_id, lat, lng, media_url, ... }]

GET  /api/stories/connections        → Stories from connected users
  Response 200: [{ story_id, media_url, username, ... }]

POST /api/stories                    → Create story
  Body: { media_url, media_type, caption?, lat?, lng?, visibility? }
  Response 201: { story }

POST /api/stories/:id/view           → Mark story as viewed
  Response 200: { success }

POST /api/stories/:id/react          → React to story
  Body: { reaction_type }
  Response 200: { reaction }
```

### Posts & Reels

```
POST /api/posts                      → Create post
  Body: { media_url, caption?, lat?, lng? }
  Response 201: { post }

GET  /api/posts/feed                 → Connections feed
  Response 200: [{ post_id, media_url, likes_count, comments_count, ... }]

POST /api/posts/:id/like             → Like post
  Response 200: { liked: true }

POST /api/reels                      → Create reel
  Body: { video_url, thumbnail_url, caption?, ... }
  Response 201: { reel }

GET  /api/reels/feed                 → Reels feed (infinite scroll)
  Response 200: [{ reel_id, video_url, ... }]
```

### Chat

```
GET  /api/conversations              → List conversations
  Response 200: [{ id, username, last_message, unread_count, ... }]

GET  /api/messages                   → Get messages with user
  Query: userId
  Response 200: [{ message_id, content, sender_id, created_at, reactions }]

POST /api/messages                   → Send message
  Body: { receiver_id?, group_id?, content?, media_url? }
  Response 201: { message }

WS   /api/ws/chat?token=<jwt>        → WebSocket for real-time chat
  Messages: { type: "message"|"typing"|"read", ... }
```

### Location

```
POST /api/location/ping              → Update current location
  Body: { latitude, longitude, accuracy? }
  Response 200: { success }

GET  /api/location/heatmap           → Get heatmap data
  Response 200: [{ lat, lng, intensity }]

PUT  /api/location/ghost-mode        → Toggle ghost mode
  Body: { enabled: bool }
  Response 200: { is_ghost_mode }

POST /api/users/panic                → Panic mode (hide all data)
  Response 200: { success }
```

### Connections

```
POST /api/connections/request        → Send follow request
  Body: { target_id }
  Response 200: { connection }

PUT  /api/connections/update         → Accept/reject/block
  Body: { requester_id, status: "accepted"|"blocked" }
  Response 200: { connection }

GET  /api/connections/requests       → List pending requests
  Response 200: [{ user, mutual_friends, ... }]

GET  /api/connections/suggested      → Suggested users to follow
  Response 200: [{ user, mutual_count, ... }]
```

### Notifications

```
GET  /api/notifications              → List notifications
  Response 200: [{ type, title, message, actor, is_read, created_at }]

PUT  /api/notifications/read-all     → Mark all as read
  Response 200: { success }

POST /api/notifications/token        → Register FCM token
  Body: { token, platform }
  Response 200: { success }
```

### Admin

```
GET  /api/admin/dashboard            → Dashboard stats
  Response 200: { total_users, active_users, total_stories, ... }

GET  /api/admin/users                → List all users (paginated)
  Response 200: [{ user, is_shadow_banned, reports_count, ... }]

POST /api/admin/users/:id/actions    → Warn/suspend/ban user
  Body: { action, reason }
  Response 200: { success }

GET  /api/admin/reports              → List reports
  Response 200: [{ report_id, reporter, target, reason, status }]

PUT  /api/admin/reports/:id/resolve  → Resolve report
  Body: { resolution }
  Response 200: { success }
```

### Upload

```
POST /api/upload                     → Upload file (multipart)
  Form: file (max 20MB), cropX?, cropY?, cropWidth?, cropHeight?, aspectRatio?
  Response 200: { url: "https://r2.dev/uploads/uuid.jpg" }
```

### Other

```
GET  /api/health                     → Health check
  Response 200: { status: "healthy" }

GET  /api/crossings                  → User's path crossings
  Response 200: [{ user, location, occurred_at }]

POST /api/reports                    → Report content/user
  Body: { target_id, target_type, reason }
  Response 200: { report_id }

POST /api/support/tickets            → Create support ticket
  Body: { subject, message }
  Response 200: { ticket_id }
```

---

## 9. State Management (Frontend)

### Pattern

```
┌──────────────────────────────────────────────────────────┐
│                    STATE IN LOCOLIVE                      │
├──────────────────────┬───────────────────────────────────┤
│   Server State       │        Client State               │
│   (React Query)      │        (Zustand)                  │
├──────────────────────┼───────────────────────────────────┤
│  User profile data   │  Auth token + user object         │
│  Feed / stories      │  Theme preference (dark/light)    │
│  Posts / reels       │  Sound enabled/disabled           │
│  Chat messages       │  Network status (online/offline)  │
│  Notifications       │  UI state (sidebar open, etc.)    │
│  Admin stats         │                                    │
│  Search results      │                                    │
├──────────────────────┴───────────────────────────────────┤
│   React Query handles: caching, invalidation, refetch     │
│   Zustand handles: persistence (localStorage), sharing     │
└──────────────────────────────────────────────────────────┘
```

### Key Stores

| Store | File | Type | Persisted |
|-------|------|------|-----------|
| `useAuthStore` | `store/useAuthStore.ts` | Zustand | Yes (localStorage: `auth-storage`) |
| `adminStore` | `store/adminStore.ts` | Zustand | No |
| `AuthContext` | `context/AuthContext.tsx` | React Context | No (wraps Zustand) |
| `ThemeContext` | `context/ThemeContext.tsx` | React Context | Yes |
| `NetworkContext` | `context/NetworkContext.tsx` | React Context | No |

### Rules

- **Server data** (API responses) → React Query with `useQuery` / `useMutation`
- **Client-only data** (UI state, auth) → Zustand
- **Never store API responses in Zustand** — that's what React Query is for
- **Avoid `useState` + `useEffect` for data fetching** — use React Query

---

## 10. Common Gotchas for New Devs

### Phone Numbers
- Always stored in E.164 format: `+919999999999`
- Registration auto-prepends `+91` (India default) if no prefix given
- Phone validation uses Twilio Lookup in production, regex-only in dev

### Two WebSocket Connections
- `useChat.ts` opens `ws://host/api/ws/chat?token=...`
- `useNotifications.ts` opens the same URL independently
- Result: **2 parallel WS connections** per user. The backend handles both.
- This is intentional (separate concerns) but wasteful — may merge later.

### Cascading Radius Feed
- `service/story/story.go` line ~207-246: Feed queries start at 5km, expand to 10km → 20km → 50km until stories found
- This means 1-4 geospatial queries per feed request
- Caching would help here — not yet implemented

### Map Libraries
- Two mapping libraries are bundled: Leaflet (OpenStreetMap) + Mapbox GL
- Leaflet is used for most views; Mapbox GL for specific overlays
- Both are large bundles — this adds ~200KB to initial load

### Image Upload
- Upload endpoint accepts images up to 20MB, videos likely similarly sized
- Images are processed server-side: crop → resize → JPEG encode (quality 85%)
- Max output dimensions: 1920×1920 (1:1), 1080×1920 (9:16), etc.
- No access control on uploaded files — anyone with the URL can view

### Admin Panel
- Uses a completely separate color scheme (`bg-white`, `text-gray-*`)
- NOT theme-aware (always light mode)
- Admin role is checked from JWT payload (not re-verified from DB per-request)

### Store Confusion
- Two directories: `store/` and `stores/` — both exist
- Use `store/` for new stores
- `store/authStore.ts` and `store/userStore.ts` are **dead code** (placeholder objects, never imported)

### Environment Config
- Backend env comes from `app.env` file (NOT from OS env vars in dev)
- Frontend env comes from `.env` / `.env.production` files
- In production: `ENVIRONMENT=production` → enables release mode, strict CORS, Twilio Lookup
- If `ENVIRONMENT` is NOT `production`: rate limiting bypassed, CORS allows any origin, debug logs include SQL

### Testing Gap
- Frontend: **zero tests** (no test framework installed)
- Backend: **~2% coverage** (7 test files)
- `TestCreateUser/OK` in `user_test.go` is **broken** (generates phone without `+91` prefix)

---

## 11. Deployment

### Build

```bash
# Backend — build binary
cd backend/locolive-backend-main
go build -o locolive-api cmd/server/main.go

# Frontend — build static files
cd frontend/frontend
npm run build    # Output: dist/
```

### Deploy

The Go binary serves both the API and the frontend static files:

```
Server binary path: /var/www/locolive-backend/locolive-api
Frontend path:      /var/www/locolive-backend/../../frontend/frontend/dist/
                    (relative from server CWD)
Uploads path:       ./uploads/
```

### Env Vars Required

| Variable | Example | Required |
|----------|---------|----------|
| `ENVIRONMENT` | `production` | Yes |
| `DB_SOURCE` | `postgresql://user:pass@host:5432/db?sslmode=require` | Yes |
| `REDIS_ADDRESS` | `127.0.0.1:6379` | Yes |
| `JWT_SECRET` | 64-char hex string | Yes |
| `SERVER_ADDRESS` | `0.0.0.0:8080` | No (default) |
| `GOOGLE_CLIENT_ID` | OAuth client ID | If Google auth used |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret | If Google auth used |
| `R2_ACCOUNT_ID` | Cloudflare account ID | If R2 used |
| `R2_ACCESS_KEY` | R2 access key | If R2 used |
| `R2_SECRET_KEY` | R2 secret key | If R2 used |
| `R2_BUCKET_NAME` | `locolive` | If R2 used |
| `R2_PUBLIC_URL` | R2 public bucket URL | If R2 used |
| `FRONTEND_URL` | `https://locolive.appnity.co.in` | Yes (CORS) |
| `EMAIL_SENDER_PASSWORD` | Gmail app password | If email used |
| `FIREBASE_CREDENTIALS_PATH` | `./firebase-adminsdk.json` | If Firebase used |

### Nginx

Two config files exist (use one):
- `nginx-locolive-site.conf` — Site config, put in `/etc/nginx/sites-available/`
- `nginx.conf` — Full config (replaces `/etc/nginx/nginx.conf`)

Key nginx responsibilities:
- SSL termination
- Proxy `/api` and `/ws/` to Go backend
- Serve static frontend assets with cache headers
- WebSocket upgrade support (already configured)

### Systemd

```
Unit: locolive-api.service
Path: /etc/systemd/system/locolive-api.service
Commands:
  sudo systemctl start locolive-api
  sudo systemctl enable locolive-api
  sudo journalctl -u locolive-api -f    # View logs
```
