# 🍔 Food Buds — Food Delivery App

> A premium, full-featured food delivery web application built with **HTML, Vanilla CSS & JavaScript**, powered by **Vite**.  
> Order food, shop groceries, book dine-out tables, and track your delivery live on a real map — all in one place.

---

## 🌐 Live Preview

- **Development Server:** Run locally at: **[http://localhost:5173](http://localhost:5173)**
- **Direct File System (Offline):** Open the built **`dist/index.html`** file directly in any browser (e.g., double-clicking from your folder) using the **`file://`** protocol. All styles, icons, and downloaded images will load and operate fully.

---

## ✨ Features

### 🍽️ Food Delivery Tab
- **Category Slider** — Browse by Idli, Dosa, Vada, Coffee, Cake, Paratha, Juice & **Non Veg**
- **Non-Veg Section** — 30 varieties including Chicken, Mutton, Egg & Seafood dishes
- **Restaurant Grid** — Real restaurant cards with ratings, delivery time & cuisine tags
- **⚡ Bolt Delivery** — Fast delivery badge for restaurants under 20 mins
- **Search & Filters** — Filter by Pure Veg, Ratings 4.0+, Fast Delivery
- **Foodie Verse Deals** — 70% OFF, Flat ₹150 OFF, BOGO, ₹99 Meals offers
- **99 Store** — Budget meals under ₹99 with free delivery
- **Train PNR Food** — Enter 10-digit PNR to order food to your train seat

### 🛒 Instamart (Grocery Tab)
- **6 Categories** — Vegetables, Fruits, Dairy, Grains, Masalas & Oils
- **90+ grocery items** with add/remove cart support
- **Real-time search** across all grocery items

### 🍷 Dineout Tab
- **20 premium restaurants** listed with ratings, cuisine & location
- **Table booking** with discount offer redemption
- **Search** by restaurant name, cuisine or location

### 🛍️ Smart Cart
- **Slide-out cart drawer** with quantity controls
- **Coupon codes** — `SWIGGY60`, `FOODBUDS60`, `FOODBUDS70`, `FOODBUDS150`
- **Price breakdown** — Item total, delivery fee, platform fee, discount & grand total
- **Cart conflict detection** — Warns when mixing food from different restaurants

### 💳 Checkout Wizard
- **2-step wizard** — Delivery Address → Payment Method
- Supports **UPI, Credit/Debit Card, Cash on Delivery**

### 🗺️ Live Order Tracking
- **Real OpenStreetMap** powered by **Leaflet.js** (no API key needed)
- 🍽️ Restaurant marker & 🏠 Home delivery marker on real Bangalore streets
- 🏍️ **Animated rider** moves along the route in real time
- **Live timeline** — Order Placed → In Kitchen → Out for Delivery → Delivered
- **Confetti celebration** on order placement

### 👤 Auth System
- Sign In / Register flow (simulated, any value works)
- User avatar in header with Sign Out
- Cart persists via **localStorage**

### 📍 Location-Based Restaurants
- Enter any location to fetch real restaurants via **OpenStreetMap Nominatim API**
- Smart fallback to simulated restaurant data if offline

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| **HTML5** | App structure & semantic markup |
| **Vanilla CSS** | Custom design system, animations, glassmorphism |
| **JavaScript (ES6+)** | Full app logic, state management, DOM rendering |
| **Vite** | Lightning-fast dev server & build tool |
| **Leaflet.js** | Real interactive OpenStreetMap for order tracking |
| **OpenStreetMap** | Free map tiles — no API key required |
| **Nominatim API** | Real-time restaurant geocoding by location |
| **Font Awesome 6** | Premium icon set |
| **Google Fonts** | Inter & Outfit typography |

---

## 📁 Project Structure

```
Food-Delivery-App/
│
├── public/
│   └── images/              # All food, restaurant & grocery images
│       ├── img_1.jpg → img_338.jpg   (original images)
│       └── img_339.jpg → img_368.jpg (non-veg images downloaded from Google)
│
├── src/
│   ├── data.js              # All app data (menus, restaurants, groceries)
│   ├── main.js              # Full app logic & rendering engine
│   └── style.css            # Complete design system & all styles
│
├── index.html               # App shell & all modals
├── vite.config.js           # Vite config + auto image downloader plugin
├── download-nonveg.js       # Script to download non-veg images from Google
├── package.json
└── README.md
```

---

## 📦 Data Overview (`src/data.js`)

| Export | Description | Count |
|---|---|---|
| `foodOptions` | Category slider items (Idli, Dosa... Non Veg) | 9 |
| `categoryDishes` | Dishes per food category | 8 categories, 80+ dishes |
| `categoryDishes.nonveg` | Non-veg varieties | **30 dishes** |
| `restaurants` | Base restaurant list | 3 |
| `dineoutRestaurants` | Dineout venue cards | 20 |
| `instamartCategories` | Grocery category sidebar | 6 |
| `groceryItems` | All grocery products | 90 items |
| `ninetyNineStoreItems` | ₹99 budget meal cards | 5 |
| `trainStationRestaurants` | PNR train food data | 1 demo PNR |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18+ installed

### Installation

```bash
# 1. Clone or open the project folder
cd "d:/Tap HTMl,Css project/Food-Delivery-App"

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

### Open in browser
```
http://localhost:5173
```

### Build for production
```bash
# Compile and bundle the project
npm run build
```

Once built, you can run the app in two ways:
1. **Local Preview Server:** Run `npm run preview` to serve the build locally at `http://localhost:4173`.
2. **Direct File System:** Simply open `dist/index.html` directly in your browser (e.g. by double-clicking it in Windows Explorer). It runs fully on the `file://` protocol.

---

## 🎯 Coupon Codes

| Code | Discount |
|---|---|
| `SWIGGY60` | 60% OFF on item total |
| `FOODBUDS60` | 60% OFF on item total |
| `FOODBUDS70` | 70% OFF on item total |
| `FOODBUDS150` | Flat ₹150 OFF |

---

## 🗺️ Map Tracking Details

The live order tracking uses **Leaflet.js + OpenStreetMap** (completely free):

- **Restaurant Point**: Koramangala 5th Block, Bangalore (`12.9352, 77.6245`)
- **Delivery Point**: Koramangala 8th Block, Bangalore (`12.9279, 77.6271`)
- **Route**: Animated dashed orange polyline along 5 waypoints
- **Rider**: 🏍️ emoji marker with orange pulse animation, moves step-by-step
- **Stages**: Kitchen (4.5s) → Out for Delivery (4.5s) → Arrived

---

## 🖼️ Auto Image Downloader

The `vite.config.js` includes a **custom Vite plugin** that:
1. Watches `src/data.js`, `src/main.js`, and `index.html` for changes
2. Detects any `http://` or `https://` image URLs added to those files
3. **Automatically downloads** them to `public/images/` as `img_N.jpg`
4. **Replaces** the external URL in the source file with the local `/images/img_N.jpg` path

You can also manually run the non-veg image downloader:
```bash
node download-nonveg.js
```

---

## 🎨 Design Highlights

- **Color Palette** — Swiggy Orange (`#FF5200`), Success Green (`#60B246`), Dark Navy (`#282C3F`)
- **Typography** — `Outfit` for headings, `Inter` for body text
- **Glassmorphism** — Frosted glass modals with backdrop blur
- **Micro-animations** — Hover effects, pulse badges, confetti explosions
- **Responsive** — Mobile-first layout with sidebar/grid switching

---

## 📱 Key Pages / Sections

| Section | Description |
|---|---|
| **Hero** | Full-width search with location & food search bars |
| **Tab Cards** | Food Delivery / Instamart / Dineout switcher |
| **Food Tab** | Category slider, deals, 99 Store, restaurant grid |
| **Non Veg** | 30 non-veg dishes with unique images |
| **Grocery Tab** | Sidebar categories + product grid |
| **Dineout Tab** | Venue cards with table booking |
| **Cart Drawer** | Slide-in cart with coupon & checkout |
| **Checkout Modal** | Address → Payment 2-step wizard |
| **Tracker Modal** | Real Leaflet map + timeline tracker |
| **Auth Modal** | Sign In / Register |
| **About Modal** | App info popup via footer |

---

## 👨‍💻 Built With

**Version:** 2.4.0 (Mesh Upgrades)  
**© 2026 Food Buds Pvt. Ltd. All rights reserved.**
