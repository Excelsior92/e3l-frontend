# 📌 App Overview & Objectives
E3L.ai is an AI-powered platform designed to help learners—including students, professionals, and graduates—overcome career confusion, skill gaps, and personal roadblocks. It serves as a personal AI companion that understands user concerns through chat, provides logical solutions, and recommends tailored resources, roadmaps, and assessments.  
The platform prioritizes deep understanding, emotional connection, and minimal friction in user interaction.

## 🎯 Target Audience
- College students unsure of career direction
- Early-career professionals feeling stuck
- Mid-career individuals looking to switch roles
- Self-learners trying to build structure in their learning
- Global users seeking clarity in skills, goals, and mindset

## 🧩 Core Features & Functionality

### AI Chat Interface
- Default landing page
- Personal, Perplexity-style conversation experience
- AI asks follow-up questions to deeply understand the user
- Suggests roadmaps, resources, and action plans

### Sidebar Navigation
- **Chat** (main screen)
- **Resources** (curated internal + external content)
- **Profile** (user data, assessments, saved content)

### Assessments
- Career-related and personal assessments
- Mix of MCQs and AI-led interactive questions
- Post-assessment insights and updated learning plans

### Content Recommendation Engine
- **Internal**: PDFs, templates, tools, roadmaps
- **External**: Handpicked YouTube videos, online courses
- Personalized tagging for smarter delivery

### Progress Tracking
- AI remembers past conversations and suggestions
- Tracks completed assessments and roadmap progress

### User Access Flow
- Start chatting instantly without signing up
- Signup prompt (Google login) after a few messages

## ⚙️ High-Level Technical Stack (Recommended)

| **Layer**          | **Suggested Stack**    | **Notes**                                           |
|--------------------|------------------------|-----------------------------------------------------|
| **Frontend**       | Next.js (React)        | Minimal UI with routing, SSR, smooth dev experience |
| **Backend/API**    | Next.js API routes     | Simple and integrated with frontend                |
| **Database**       | Supabase               | Postgres + Auth + Storage + real-time              |
| **Auth**           | Supabase Auth / Google OAuth | Easy Google sign-in support                      |
| **AI Layer**       | OpenAI GPT (API access)| For chat and assessment logic                       |
| **Storage**        | Supabase Storage       | For internal PDFs, tools, templates                 |
| **Deployment**     | Vercel                 | Seamless deploys and hosting                       |

## 🧠 Conceptual Data Model

### User
- `id`
- `name`
- `email`
- `preferences / goals`
- `chat history`
- `roadmap progress`
- `completed assessments`

### Resource
- `id`
- `title`
- `type` (PDF, video, course, etc.)
- `source` (internal, external)
- `tags` (career, motivation, product mgmt, etc.)
- `link or storage path`

### Assessment
- `id`
- `title`
- `questions` (type: MCQ or AI-led)
- `results / logic`
- `linked recommendations`

### Roadmap
- `id`
- `title`
- `steps`
- `related tags`
- `suggested for` (user goals/states)

## 🧪 UI/UX Principles
- Minimal and distraction-free
- Perplexity-style clean layout
- White and blue only color theme
- Fast access to chat and core features
- Feel like a 1-on-1 interaction with a helpful companion
- Immediate value, delayed signup friction

## 🔒 Security Considerations
- Use OAuth for secure sign-in (Google)
- Store user data securely (Supabase handles auth rules)
- Limit LLM data exposure (avoid sending PII)
- Option to delete chat history or profile for user privacy

## 🚧 Development Phases

| **Phase**        | **Focus**                                              |
|------------------|--------------------------------------------------------|
| **1. Setup**     | Design final UI layout, database schema, and content format |
| **2. Core Chat** | Build chat UI + integrate OpenAI with structured flows  |
| **3. Auth**      | Add Google login + user account creation               |
| **4. Content**   | Load internal/external resources + basic tagging system |
| **5. Assessments** | Add MCQs + AI-led assessments and insights           |
| **6. Personalization** | Track progress, match resources to goals         |
| **7. Polish**    | UI cleanup, bug fixing, test with early users          |
| **8. Launch**    | MVP soft launch (invite-only or limited beta)         |

## ⚠️ Potential Challenges & Solutions

| **Challenge**                      | **Solution**                                         |
|-------------------------------------|-----------------------------------------------------|
| Making AI feel truly personal       | Guide AI with structured prompts + memory tracking per user |
| Content overwhelm                   | Start with 15–20 curated high-impact resources      |
| Friction in signup                  | Let users chat first, ask for login later           |
| Tracking user progress              | Link chat + roadmap + assessment history together early |
| Time to MVP                         | Stick to a strict 8-week phased timeline            |

## 🔮 Future Expansion Possibilities
- Mobile app (React Native or Flutter)
- More tabs: “Goals,” “Tasks,” “Live Q&A”
- Weekly planner synced to Google Calendar
- Community discussions or peer mentoring
- Deeper integrations with LMS or learning platforms
- AI mentor personas with unique guidance styles
