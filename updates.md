# Nowhere Nest - Project Updates

This file logs all structural updates, features implemented, and changes made to the project.

## [2026-05-29] Project Initialized
- Created implementation plan and verified folder structure.
- Created `updates.md` to track development progress.
- Prepared frontend/backend directories setup.

## [2026-05-29] Full-Stack Backend Implementation (Node.js/Express/Mongoose)
- **Database Architecture**: Implemented MongoDB database schemas using Mongoose in `backend/src/models/`:
  - [User.js](file:///d:/nowherenest/backend/src/models/User.js): Role-based accounts (`customer`, `owner`, `admin`), wallets, and bank details.
  - [Listing.js](file:///d:/nowherenest/backend/src/models/Listing.js): Supports stays (priced per night) and rentals (monthly PG rent + deposit). Also stores coordinate maps and custom USPs (tours/treks).
  - [Booking.js](file:///d:/nowherenest/backend/src/models/Booking.js): Records booking dates, totals, and commission split values.
  - [Payout.js](file:///d:/nowherenest/backend/src/models/Payout.js): Tracks withdrawals and bank snapshots.
  - [Ride.js](file:///d:/nowherenest/backend/src/models/Ride.js): Stores taxi bookings and live coordinates.
- **REST Endpoints & Controllers**: Created robust route handlers in `backend/src/controllers/` and `backend/src/routes/`:
  - `authRoutes.js`: Hashed password register/login, simulated OTP gateway (sandbox verification), and bank profiles. Added profile update endpoint (PUT `/profile`) to sync roles dynamically.
  - `listingRoutes.js`: Property CRUD, coordinates picker, categories/amenities queries, and listings search.
  - `bookingRoutes.js`: Unified checkout, automatic platform commission splits (10%), and host wallet balance updates.
  - `payoutRoutes.js`: Withdrawals (minimum $100) and admin status controller (approval transfers, automatic wallet refunds on rejection).
  - `rideRoutes.js`: Cab rides dispatching, fare quoting, driver selection, and mathematical routing paths.
  - `adminRoutes.js`: Aggregated business stats (sales volume, net commissions, user counts).
- **Security & Database Seeds**: 
  - Integrated [auth.js](file:///d:/nowherenest/backend/src/middleware/auth.js) middleware for checking JWT tokens.
  - Created [seed.js](file:///d:/nowherenest/backend/src/config/seed.js) script that auto-seers Kerala homestays and PG properties matching design mockups upon first launch.

## [2026-05-29] High-Fidelity Frontend Client (React/Leaflet/Vanilla CSS)
- **Styling System**: Created CSS layout standards using primary dark green (#0A3B2A) and mint-green accents:
  - [variables.css](file:///d:/nowherenest/frontend/src/styles/variables.css): Standard fonts, colors, and layout variables.
  - [index.css](file:///d:/nowherenest/frontend/src/index.css): Shared utilities, badges, forms, and custom scrollbar overrides.
- **Unified State Management**: Created [AuthContext.jsx](file:///d:/nowherenest/frontend/src/context/AuthContext.jsx) to sync user profiles, bank links, and wallet updates across tabs.
- **Interactive Maps & Components**:
  - Built sticky [Navbar.jsx](file:///d:/nowherenest/frontend/src/components/Navbar.jsx) and [Footer.jsx](file:///d:/nowherenest/frontend/src/components/Footer.jsx) showing owner wallet balance pills.
  - Built [LeafletMap.jsx](file:///d:/nowherenest/frontend/src/components/LeafletMap.jsx) mapping stays with custom map pins.
- **View Screens**:
  - [Login.jsx](file:///d:/nowherenest/frontend/src/pages/Login.jsx): Signup/signin form supporting developer-mode OTP verification.
  - [Home.jsx](file:///d:/nowherenest/frontend/src/pages/Home.jsx): Smart travel stay engine showing hotel listings, flash deals, and guide packages.
  - [Rentals.jsx](file:///d:/nowherenest/frontend/src/pages/Rentals.jsx): Co-living rooms list indicating monthly rent, security deposit, and zero brokerage.
  - [DetailView.jsx](file:///d:/nowherenest/frontend/src/pages/DetailView.jsx): Detail booking interface with checkbox selectors for treks/tours and checkout receipts.
  - [OwnerDashboard.jsx](file:///d:/nowherenest/frontend/src/pages/OwnerDashboard.jsx): Multi-tab panel for hosts to manage listings, inspect guest books, link bank accounts, and pick coordinates on a map.
  - [AdminDashboard.jsx](file:///d:/nowherenest/frontend/src/pages/AdminDashboard.jsx): Panel for system administrators to check financials, adjust commission rates, and review payouts.
  - [CabBooking.jsx](file:///d:/nowherenest/frontend/src/pages/CabBooking.jsx): Simulated cab booking system, routing paths, and live driver marker animations on OpenStreetMap.

## [2026-05-29] Firebase Authentication & Premium UI/UX Refinements
- **Firebase Auth Setup**: Connected client app with Firebase using project credentials in [firebase.js](file:///d:/nowherenest/frontend/src/config/firebase.js).
- **Google Sign-In**: Added custom "Continue with Google" popup authentication in [Login.jsx](file:///d:/nowherenest/frontend/src/pages/Login.jsx).
- **Email Verification**: Added check for email verification status. Displays warning banner to verify mail links.
- **Real SMS OTP Authentication**: Implemented Firebase Invisible reCAPTCHA verifiers. Sends SMS code dynamically.
- **Backend ID Verification**: Implemented dynamic Firebase token signature checking inside [auth.js](file:///d:/nowherenest/backend/src/middleware/auth.js) middleware by fetching Google certificates using the `jwks-rsa` package.
- **MongoDB Sync & Profiles Setup**: Enabled profile setup forms. Users logging in via Google/Phone can choose custom roles (Guest vs Host) which sync to MongoDB in real time.

## [2026-05-29] Interactive Role Selection & Validation Fixes
- **Login Role Tabs Selector**: Added a segmented role selector (🎒 Guest Booking vs 🏡 List Stays Host) at the top of the sign-in form. Firebase logins (Google and Phone OTP) now automatically register and sync to MongoDB with the correct role selected.
- **Seamless Transition (Become Host)**: Added a "Become a Host" button in the navigation bar for logged-in guests. Clicking it immediately switches their profile role to host/owner in MongoDB and redirects them to the Owner Dashboard.
- **SMS Input Length Validation**: Enhanced phone length checks to detect short numbers (like 9 digits) and display helpful error feedback on-screen before dispatching requests to Firebase.
- **Google JWKS URI Typo Fix**: Fixed a service account name typo in Google's certificate endpoint inside [auth.js](file:///d:/nowherenest/backend/src/middleware/auth.js), restoring token verification and profile synchronization.

## [2026-05-30] Phase 3 Upgrades: Multiple Photos, Lightboxes, Per-Person Pricing, Guest Entry & Google Maps UI
- **Multiple Photos Builder**: Replaced single text inputs with dynamic tag-like multiple image list builders for stay properties and rooms in [Properties.jsx](file:///d:/nowherenest/host-app/src/pages/Properties.jsx) and [Rooms.jsx](file:///d:/nowherenest/host-app/src/pages/Rooms.jsx).
- **Interactive Carousel & Lightbox**: Rendered sliding image carousels for property banners and added scrollable lightbox galleries for room categories inside [DetailView.jsx](file:///d:/nowherenest/customer-app/src/pages/DetailView.jsx).
- **Guest Name & Age Validator Form**: Integrated guest count dropdown and details sub-form (names/ages) bounded by room capacity. Added `guests` field to database booking schema.
- **Per-Person Experiences Pricing**: Added "Charge Model" selector (Per Stay vs Per Guest) in host app. On checkout, per-person experiences are multiplied by guest counts and display a clear breakdown in customer receipts.
- **Google Maps Styled Leaflet map**: Upgraded [LeafletMap.jsx](file:///d:/nowherenest/customer-app/src/components/LeafletMap.jsx) to match Google Maps' UI, adding floating search input, category chips filter, satellite view toggle, Locate Me button, real-time WatchPosition tracking toggle, and driving/bicycling/walking transit mode selectors.
- **Expanded Presets**: Added travel location presets covering major states and regions in India (Tamil Nadu, Kerala, Karnataka, Maharashtra, Delhi, Goa, Rajasthan, Himachal Pradesh, West Bengal, Telangana, Andhra Pradesh).

