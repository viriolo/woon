# Woon Feature Implementation Guide

This guide breaks down the major initiatives outlined in the roadmap into actionable engineering tasks. Follow the recommended order: update schema, implement backend services, expose APIs, then wire UI/UX. Use feature flags where possible and ensure automated tests cover new logic.

## 1. Social & Community Features Implementation

### A. Follow/Friends System

**Database schema changes (`database.ts` migrations):**
```sql
CREATE TABLE IF NOT EXISTS friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID REFERENCES users(id),
    addressee_id UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'blocked'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(requester_id, addressee_id)
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0;
```

**Type updates (`types.ts`):**
```ts
export interface User {
  // existing fields...
  followingCount: number;
  followersCount: number;
  isFollowing?: boolean; // derived in queries
}

export interface Friendship {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: 'pending' | 'accepted' | 'blocked';
  createdAt: string;
}
```

**Service layer (`services/friendService.ts`):**
```ts
export const friendService = {
  async sendFriendRequest(requesterId: string, addresseeId: string) {
    // Insert friendship row with status 'pending'; guard against duplicates.
  },
  async acceptFriendRequest(friendshipId: string) {
    // Update status to 'accepted' and increment follower/following counters.
  },
  async getFriends(userId: string) {
    // Return accepted friendships with joined user profiles.
  },
  async getPendingRequests(userId: string) {
    // Return incoming requests still marked 'pending'.
  }
};
```

**UI (`components/FriendsView.tsx`):**
- Friend search, list of accepted friends, pending requests, mutual friend indicators.
- Attach follow/unfollow buttons to profile cards.

### B. Social Sharing Integration

**Share button (`components/ShareButton.tsx`):**
```tsx
export const ShareButton = ({ celebration }: { celebration: Celebration }) => {
  const shareData = {
    title: celebration.title,
    text: `Check out this celebration by ${celebration.author}`,
    url: `${window.location.origin}/celebration/${celebration.id}`,
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      await navigator.clipboard.writeText(shareData.url);
      // Surface toast confirming link copied.
    }
  };

  return <button onClick={handleShare}>Share</button>;
};
```

**Usage (`components/CelebrationDetailView.tsx`):**
```tsx
<ShareButton celebration={celebration} />
```

### C. @Mentions in Comments

**Schema:**
```sql
ALTER TABLE comments ADD COLUMN IF NOT EXISTS mentioned_user_ids UUID[];
```

**Mention input (`components/MentionInput.tsx`):**
```tsx
const MentionInput = ({ onSubmit }: { onSubmit: (text: string, mentions: string[]) => void }) => {
  const [text, setText] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleChange = (value: string) => {
    setText(value);
    setShowSuggestions(value.includes('@'));
  };

  // Render input + suggestion dropdown; call onSubmit(text, mentionIds) on send.
};
```

---

## 2. Gamification & Achievement System

### A. Achievement Schema

```sql
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    category VARCHAR(50), -- 'social', 'creation', 'discovery', 'streak'
    points INTEGER DEFAULT 0,
    requirement_type VARCHAR(50), -- 'celebration_count', 'like_count', 'streak_days'
    requirement_value INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    achievement_id UUID REFERENCES achievements(id),
    unlocked_at TIMESTAMP DEFAULT NOW(),
    progress INTEGER DEFAULT 0,
    UNIQUE(user_id, achievement_id)
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_celebration_date DATE;
```

### B. Achievement Service (`services/achievementService.ts`)

```ts
export const achievementService = {
  async initializeAchievements() {
    const achievements = [
      { name: 'First Celebration', description: 'Share your first celebration', icon: '', category: 'creation', points: 10, requirement_type: 'celebration_count', requirement_value: 1 },
      { name: 'Social Butterfly', description: 'Like 50 celebrations', icon: '', category: 'social', points: 25, requirement_type: 'like_count', requirement_value: 50 },
      { name: 'Week Warrior', description: 'Maintain a 7-day streak', icon: '', category: 'streak', points: 50, requirement_type: 'streak_days', requirement_value: 7 },
      { name: 'Explorer', description: 'Discover 100 celebrations', icon: '', category: 'discovery', points: 30, requirement_type: 'discovery_count', requirement_value: 100 }
    ];
    // Upsert into achievements table.
  },
  async checkAndUnlockAchievements(userId: string, actionType: string, newValue: number) {
    // Compare progress vs. requirement; update user_achievements and return newly unlocked rows.
  },
  async getUserAchievements(userId: string) {
    // Join user_achievements with achievements for dashboard.
  }
};
```

### C. Streak Logic (`services/authService.ts` or relevant module)

```ts
const updateUserStreak = async (userId: string) => {
  const user = await userService.getUserById(userId);
  const today = new Date().toISOString().split('T')[0];
  const lastDate = user.lastCelebrationDate;

  if (!lastDate) {
    await sql`UPDATE users SET current_streak = 1, longest_streak = 1, last_celebration_date = ${today} WHERE id = ${userId}`;
    return;
  }

  const daysDiff = Math.floor(
    (new Date(today).getTime() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysDiff === 1) {
    const newStreak = user.currentStreak + 1;
    const longestStreak = Math.max(newStreak, user.longestStreak);
    await sql`UPDATE users SET current_streak = ${newStreak}, longest_streak = ${longestStreak}, last_celebration_date = ${today} WHERE id = ${userId}`;
  } else if (daysDiff > 1) {
    await sql`UPDATE users SET current_streak = 1, last_celebration_date = ${today} WHERE id = ${userId}`;
  }
};
```

---

## 3. Discovery & Personalization Features

### A. AI-Powered Recommendations (`services/recommendationService.ts`)

```ts
export const recommendationService = {
  async getPersonalizedRecommendations(userId: string, userLocation: { lat: number; lng: number }) {
    const user = await userService.getUserById(userId);
    const userLikes = await celebrationService.getUserLikedCelebrations(userId);

    const prompt = `Based on a user who has liked celebrations about: ${userLikes.map(c => c.title).join(', ')}, and lives in location lat:${userLocation.lat}, lng:${userLocation.lng}, suggest 5 celebration themes or activities they might enjoy. Respond with JSON array of {title, description, category}.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const result = await response.json();
    return JSON.parse(result.candidates[0].content.parts[0].text);
  }
};
```

### B. Enhanced Search (`components/DiscoveryView.tsx`)

```tsx
const [filters, setFilters] = useState({
  timeRange: 'all',
  distance: 50,
  category: 'all',
  groupSize: 'all'
});

const FilterBar = () => (
  <div className="flex gap-2 overflow-x-auto p-4">
    <select value={filters.timeRange} onChange={(e) => setFilters({ ...filters, timeRange: e.target.value })}>
      <option value="all">Any Time</option>
      <option value="today">Today</option>
      <option value="this_week">This Week</option>
      <option value="this_month">This Month</option>
    </select>

    <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
      <option value="all">All Categories</option>
      <option value="birthday">Birthdays</option>
      <option value="holiday">Holidays</option>
      <option value="achievement">Achievements</option>
    </select>

    <input
      type="range"
      min="1"
      max="100"
      value={filters.distance}
      onChange={(e) => setFilters({ ...filters, distance: parseInt(e.target.value, 10) })}
    />
    <span>{filters.distance}km</span>
  </div>
);

const filteredCelebrations = celebrations.filter((celebration) => {
  // Apply time, distance, category, and group size filters.
  return true;
});
```

### C. Weather-Aware Suggestions (`services/weatherService.ts`)

```ts
export const weatherService = {
  async getCurrentWeather(lat: number, lng: number) {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${process.env.WEATHER_API_KEY}`);
    return response.json();
  },
  getWeatherBasedSuggestions(weather: any) {
    if (weather.main.temp < 10) {
      return ['Indoor celebrations', 'Cozy gatherings', 'Hot chocolate parties'];
    }
    if (weather.weather[0].main === 'Rain') {
      return ['Indoor activities', 'Rainy day celebrations', 'Board game nights'];
    }
    if (weather.main.temp > 25) {
      return ['Outdoor BBQ', 'Beach celebrations', 'Garden parties'];
    }
    return ['Any celebration type'];
  }
};
```

---

## 4. Content Creation Tools

### A. Video Support

**Schema updates:**
```sql
ALTER TABLE celebrations ADD COLUMN IF NOT EXISTS media_type VARCHAR(20) DEFAULT 'image';
ALTER TABLE celebrations ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE celebrations ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
```

**Media upload (`components/CreateView.tsx`):**
```tsx
const MediaUpload = ({ onMediaSelect }: { onMediaSelect: (file: File, type: 'image' | 'video') => void }) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const type = file.type.startsWith('video/') ? 'video' : 'image';
    onMediaSelect(file, type);
  };

  return (
    <input
      type="file"
      accept="image/*,video/*"
      onChange={handleFileChange}
      className="hidden"
    />
  );
};

const generateVideoThumbnail = (videoFile: File): Promise<string> => new Promise((resolve) => {
  const video = document.createElement('video');
  video.src = URL.createObjectURL(videoFile);
  video.currentTime = 1;

  video.onloadedmetadata = () => {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context?.drawImage(video, 0, 0);
    resolve(canvas.toDataURL());
  };
});
```

### B. Story Templates (`components/StoryTemplates.tsx`)

```tsx
const templates = [
  {
    id: 'birthday',
    name: 'Birthday Celebration',
    layout: 'grid',
    textAreas: [
      { id: 'title', placeholder: 'Happy Birthday [Name]!', position: 'top' },
      { id: 'message', placeholder: 'Write your birthday message...', position: 'bottom' }
    ],
    imageSlots: [
      { id: 'main', position: 'center', size: 'large' },
      { id: 'collage', position: 'side', size: 'small', count: 4 }
    ]
  },
  {
    id: 'achievement',
    name: 'Achievement Celebration',
    layout: 'hero',
    textAreas: [
      { id: 'achievement', placeholder: 'What did you achieve?', position: 'overlay' },
      { id: 'story', placeholder: 'Tell your story...', position: 'bottom' }
    ],
    imageSlots: [
      { id: 'hero', position: 'full', size: 'full' }
    ]
  }
];

const TemplateSelector = ({ onSelectTemplate }: { onSelectTemplate: (template: typeof templates[number]) => void }) => (
  <div className="grid grid-cols-2 gap-4">
    {templates.map((template) => (
      <button key={template.id} onClick={() => onSelectTemplate(template)}>
        <div className="p-4 border rounded-lg">
          <h3>{template.name}</h3>
          <div className="preview-layout">{/* Preview stub */}</div>
        </div>
      </button>
    ))}
  </div>
);
```

### C. Collaborative Stories

**Schema:**
```sql
CREATE TABLE IF NOT EXISTS collaborative_celebrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    creator_id UUID REFERENCES users(id),
    collaborator_ids UUID[],
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    deadline TIMESTAMP
);

CREATE TABLE IF NOT EXISTS collaboration_contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collaboration_id UUID REFERENCES collaborative_celebrations(id),
    contributor_id UUID REFERENCES users(id),
    media_url TEXT,
    caption TEXT,
    contributed_at TIMESTAMP DEFAULT NOW()
);
```

**Component scaffold:**
```tsx
const CollaborativeCelebration = ({ collaborationId }: { collaborationId: string }) => {
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');

  const inviteCollaborator = async () => {
    // Send invite, update collaborator_ids.
  };

  const addContribution = async (mediaFile: File, caption: string) => {
    // Upload and persist contribution.
  };

  return (
    <div>
      <div className="invite-section">
        <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="Invite by email" />
        <button onClick={inviteCollaborator}>Invite</button>
      </div>
      <div className="contributions-grid">
        {contributions.map((contribution) => (
          <div key={contribution.id} className="contribution-card">
            <img src={contribution.mediaUrl} alt={contribution.caption} />
            <p>{contribution.caption}</p>
            <span>by {contribution.contributorName}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

## 5. Advanced Technical Features & Monetization

### A. Offline Mode (Service Worker)

**`public/sw.js`:**
```js
const CACHE_NAME = 'woon-v1';
const urlsToCache = ['/', '/static/js/bundle.js', '/static/css/main.css', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/celebrations')) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        if (response) return response;
        return fetch(event.request).then((networkResponse) => {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return networkResponse;
        });
      })
    );
  }
});
```

**Registration (`main.tsx`):**
```ts
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => console.log('Service worker registered', registration))
      .catch((error) => console.error('Service worker registration failed', error));
  });
}
```

### B. Push Notifications (`services/notificationService.ts`)

```ts
export const notificationService = {
  async requestPermission() {
    return (await Notification.requestPermission()) === 'granted';
  },
  async subscribeToPush() {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: process.env.VAPID_PUBLIC_KEY
    });

    await fetch('/api/subscribe-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription)
    });
  },
  async scheduleNotification(userId: string, message: string, scheduledTime: Date) {
    await fetch('/api/schedule-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, message, scheduledTime })
    });
  }
};
```

### C. Premium Subscription System

**Schema:**
```sql
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    plan_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    started_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    stripe_subscription_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(20) DEFAULT 'free';
```

**Stripe integration (`services/paymentService.ts`):**
```ts
export const paymentService = {
  async createCheckoutSession(userId: string, planType: 'pro' | 'business') {
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, planType })
    });
    const { sessionId } = await response.json();
    const stripe = window.Stripe(process.env.STRIPE_PUBLIC_KEY);
    await stripe.redirectToCheckout({ sessionId });
  },
  async cancelSubscription(subscriptionId: string) {
    await fetch('/api/cancel-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscriptionId })
    });
  }
};
```

**Premium utilities (`utils/premiumFeatures.ts`):**
```ts
export const premiumFeatures = {
  canCreateUnlimitedEvents: (user: User) => user.subscriptionTier !== 'free',
  canAccessAnalytics: (user: User) => ['pro', 'business'].includes(user.subscriptionTier),
  canCustomizeMapStyle: (user: User) => user.subscriptionTier === 'business',
  getMaxPhotosPerCelebration: (user: User) => {
    switch (user.subscriptionTier) {
      case 'free':
        return 1;
      case 'pro':
        return 10;
      case 'business':
        return 50;
      default:
        return 1;
    }
  }
};
```

**Create view guard:**
```tsx
const maxPhotos = premiumFeatures.getMaxPhotosPerCelebration(user);
if (selectedPhotos.length >= maxPhotos && user.subscriptionTier === 'free') {
  setShowUpgradeModal(true);
}
```

---

## Implementation Priority & Timeline

### Phase 1 (Weeks 1–2) – Quick Wins
1. Social sharing buttons.
2. Bookmarking / favorites.
3. Basic discovery filters (time + distance).
4. Achievement seed data + badge surfacing.

### Phase 2 (Weeks 3–6) – Core Social Features
1. Friends/follow graph + UI.
2. Comment mentions.
3. Collaborative celebrations MVP.
4. Friends activity feed.

### Phase 3 (Weeks 7–10) – Enhanced Creation
1. Video media pipeline.
2. Story template editor.
3. AI-driven recommendations.
4. Weather-aware suggestions.

### Phase 4 (Weeks 11–14) – Advanced Features
1. Offline mode + PWA polish.
2. Push notification infrastructure.
3. Analytics dashboards.
4. Premium subscription plans.

---

## Development Tips
- Execute schema migrations before backend changes; guard with `IF NOT EXISTS`.
- Build API endpoints and service tests prior to wiring UI.
- Add unit/integration tests as features land; track regression coverage.
- Gate large bets with feature flags for gradual rollout.
- Monitor performance/latency for recommendation and media services.
- Capture errors with observability tooling before enabling to all users.
- Develop on feature branches; require code review and QA prior to merge.
