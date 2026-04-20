☕ Buy Me a Chai

A full-stack creator support platform where users can receive direct support via UPI.
Built with a clean UI, real-time data handling, and secure backend using Supabase.

---

🚀 Live Concept

Buy Me a Chai allows creators to:

- Create a public profile
- Share content
- Receive support (₹) directly via UPI
- Track supporters and earnings

Supporters can:

- Explore creators
- Support them instantly
- Stay updated through notifications

---

✨ Features

👤 Authentication

- Google / Email login (Supabase Auth)
- Secure session handling

🧑‍🎨 Creator Profiles

- Unique username system
- Permanent full name (set once)
- Editable bio & avatar
- UPI ID integration

💸 UPI Support System

- Mobile → UPI deep link (GPay / PhonePe)
- Desktop → QR code payment
- Payment success simulation
- Reference number verification
- Self-support prevention

🔔 Notifications

- Real-time support notifications
- Read/unread indicator
- Dynamic updates

📊 Dashboard

- Earnings overview
- Support history
- Recent supporters

🔍 Explore Page

- Trending creators (based on real support data)
- Dynamic leaderboard
- Public creator profiles

---

🛠️ Tech Stack

Frontend

- React (Vite)
- Tailwind CSS
- Framer Motion (for UI animations)

Backend (Supabase)

- PostgreSQL Database
- Supabase Auth
- Supabase Storage (avatars)
- Row Level Security (RLS)
- RPC Functions for public data

---

🔐 Security (RLS)

We implemented Row Level Security for the "supports" table:

- Users can insert only their own support:
  
  auth.uid() = supporter_id

- Users can view:
  
  - supports they gave
  - supports they received

Public data is accessed via secure RPC functions.

---

⚙️ Supabase Setup

Required Tables

- profiles
- supports
- notifications

RPC Functions

get_creator_supports(target_creator_id uuid)
get_creator_support_counts()

---

🧪 Payment Flow (UPI Simulation)

Due to time constraints and demo requirements:

- Real UPI redirection is implemented
- Payment verification is simulated using reference number input

This allows a realistic UX while keeping the system simple.

---

📱 Responsive Design

- Fully responsive UI
- Optimized for mobile and desktop
- Clean, modern design system

---

🧹 Code Quality

- Cleaned and refactored codebase
- Removed unused logic and dead code
- Centralized core logic
- Supabase as single source of truth (no localStorage)

---

📌 Project Status

✅ Complete and functional
✅ Clean UI/UX
✅ Secure backend
✅ Ready for demo/submission

---

🎯 Future Improvements

- Razorpay / real payment verification
- Creator payouts (marketplace model)
- Comments & engagement features
- Analytics dashboard
- Subscription model

---

👨‍💻 Author

Built with focus on clean architecture, real-world usability, and simplicity.

---

📄 License

This project is for educational purposes.