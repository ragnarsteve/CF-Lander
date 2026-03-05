# Cheech & Chong CF Lander — Webflow Manual Fixes Guide

Due to Webflow MCP element_tool write operations timing out on this complex page, the following items need manual attention in the Webflow Designer.

---

## 1. DELETE DUPLICATE / EMPTY ELEMENTS

The page has duplicate sections and nav bars caused by MCP timeout-related double-creation. These need to be deleted manually:

### Duplicate Nav Bar
- There are **2 nav bars** at the top. Delete the **first one** (the one WITHOUT the logo image).

### Duplicate "Why Crowdfunding" Section
- There are **2 "Why Crowdfunding" sections** (both use `section-off-white` style). One is empty. Delete the **empty one** (the one with no children or just a container with no content).

### Empty Sections
- There are **2 completely empty sections** with no styles applied. Find and delete them — they appear between the Innovation and Team sections.

### Duplicate Media Cards (Already Hidden)
- 3 duplicate media mention cards already have the `hidden` style (display:none) applied. You can fully delete these if desired.

---

## 2. FIX TEXTBLOCK DEFAULT TEXT

Many TextBlock elements still show "This is some text inside of a div block." because Webflow's MCP doesn't support setting text on TextBlock elements. Fix these manually:

### Section 2: Macro Opportunity (Card 4)
- **Card 4 title**: Change from default text → `Industry Growth`

### Section 4: Why Crowdfunding (VS Visual)
- **"Wall Street" label**: Should read `Wall Street`
- **"VS" text**: Should read `VS`
- **"YOU" label**: Should read `YOU`

### Section 8: Brand Power
- **Hero stat number**: Should read `12.8M+`
- **Hero stat label**: Should read `Million+ Followers Across Social Media`
- **Social card platforms**: TikTok, Snapchat, Facebook, Instagram, X (Twitter), Monthly
- **Social card counts**: 7.4M, 93K, 1.5M, 3.1M, 710K, 2B+ Impressions
- **Brand block titles**: `Pit Punch & Collabs` and `A Multi-Generational Empire`

### Section 9: Innovation
- **Card icons**: 🤖, 🚀, 🎁, 🧪 (or use text: AI, Launch, Gift, Lab)
- **Card titles**: AI-Powered Efficiency, Meeting Customers Everywhere, Buy In-Store Redeem Online, Advanced Emulsion Tech

### Section 11: Regulation
- **Card icons**: ⚖, 🔎, ⚡ (or use text: Scale, Search, Bolt)

### Section 13: Investment Details
- **Detail values**: $420, Reg CF, $50M+
- **Detail labels**: Minimum Investment, SEC Regulated Offering, Annual Revenue

---

## 3. ADD REVIEW IMAGES TO CAROUSEL

Upload the 12 review images from `Assets/` folder as Webflow assets:
- `REVIEWS.io Social Proof Image (1).jpg` through `(12).jpg`

Then add them as Image elements inside the `reviews-carousel` div in Section 3. Apply the `review-img` style to each.

---

## 4. ADD MEDIA LOGOS

Upload these SVG/image assets and add them to the media mention cards:
- `Assets/logo-forbes.svg`
- `Assets/logo-cnbc.svg`
- `Assets/logo-rollingstone.svg`
- `Assets/logo-hightimes.jpg`
- `Assets/logo-usatoday.svg`
- `Assets/Logo_of_SFGate.svg`
- `Assets/logo-wsj.svg`
- `Assets/logo-entrepreneur.svg`

Each media card should have the logo and a quote paragraph beneath it.

---

## 5. ADD MOAT IMAGE

Upload `Assets/loyalty-cycle.jpg` and add it to the Competitive Moat section's `moat-img` div.

---

## 6. TAB FUNCTIONALITY

The tab structure is in place with styles. The custom code script `CFTabs` handles switching. To make it work:

1. The two tab buttons in Section 3 need `data-tab` attributes:
   - First button: `data-tab="testimonials"`
   - Second button: `data-tab="media"`

2. The media-grid div needs to be **moved inside** the media tab-content wrapper (the div with `data-tab-content="media"`).

3. The testimonial carousel (div with `data-tab-content="testimonials"`) should contain the review images.

---

## 7. CUSTOM CODE FOR D3 CHARTS & ANIMATIONS

The following interactive features need custom code embeds. Add them via **Page Settings → Custom Code → Before </body> tag**:

### External Libraries (add to Head Code):
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js"></script>
<script src="https://unpkg.com/topojson@3"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.4/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.4/ScrollTrigger.min.js"></script>
```

### Features requiring custom embeds:
- **Revenue Growth Chart** (Section 5): D3.js bar chart with tooltips
- **Market Expansion Map** (Section 6): D3.js + TopoJSON US map
- **Animated Counters** (Section 2): Counter animations for stat numbers
- **Follower Count Animation** (Section 8): Counting up to 12.8M
- **Team Grid** (Section 10): JS-populated team member cards
- **FAQ Accordion** (Section 14): Expandable Q&A items

The full JavaScript for these features is in the original `index.html` file (lines 1035-1600+). Copy the relevant sections into Webflow's custom code area.

---

## 8. HERO SECTION

The hero section needs:
- Background video or dark overlay (currently just dark background)
- Logo image in the nav bar
- Hero headline text verification
- Stats bar with animated counters

---

## SCRIPTS ALREADY DEPLOYED

Three custom scripts are registered and applied site-wide:
1. **CFCleanup** — Hides duplicate nav bars, empty sections, and duplicate sections
2. **CFTabs** — Tab switching functionality for Customer Stories / Media Mentions
3. **CFCarousel** — Auto-scrolling carousel with prev/next navigation

These will activate on the published site automatically.

---

## STYLES COMPLETED

All styles have been created and updated with proper values including responsive breakpoints:
- Desktop → Tablet (≤991px) → Mobile (≤767px) transitions
- Grid layouts collapse from multi-column to single column
- Section padding reduces on mobile
- Title font sizes scale down
