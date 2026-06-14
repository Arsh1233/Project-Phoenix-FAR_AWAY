You are a frontend engineer. Build the candidate-facing interface for Project PHOENIX.

Objective:
Create a React + TypeScript web app that:
1. Captures candidate's face (via Webcam API) and simulates fingerprint (button generates a random hash for demo).
2. Sends biometric data to the backend, receives a session token.
3. Requests fragments from the Edge Agent (not directly from crypto service) – the Edge Agent will assemble fragments.
4. Displays one question at a time, records keystroke timing (time between keypresses) and sends to AI service for behavioral fingerprinting.
5. Listens for WebSocket events from Edge Agent to handle fragment regeneration (reload question if necessary).
6. Shows a simple "Exam Health" indicator (green = all fragments valid, yellow = regeneration in progress, red = connection lost).

Tech Stack:
- React 18 + TypeScript
- Vite (bundler)
- TailwindCSS (styling)
- Webcam API (face capture) – use react-webcam
- WebSockets (Socket.io client or native WebSocket)
- Axios for REST calls

Deliverables:
- frontend/ folder with:
  - src/components/Login.tsx (face + fingerprint capture)
  - src/components/ExamScreen.tsx (question display, timer, keystroke logger)
  - src/hooks/useWebSocket.ts
  - src/services/api.ts
  - src/App.tsx
- package.json, vite.config.ts, tailwind.config.js
- README.md with run instructions (npm install, npm run dev)

Acceptance Criteria:
- Login sends face image (as base64) and fingerprint hash to /auth endpoint (mock backend endpoint provided by you).
- After login, exam screen loads first question within 500ms.
- Keystroke timings are sent to /fingerprint/verify every 10 seconds.
- If WebSocket receives "regenerate" event for current question, the question is re-fetched and replaced seamlessly.
- Works on Chrome desktop (responsive, but exam-focused).

Vibe Coding Tips:
- For demo, mock the backend endpoints if not ready – but structure code to call real URLs from .env.
- Use localStorage to store session token.
- Add a dev button "Simulate Leak" that triggers a WebSocket regeneration event.
- Keep the UI minimal but professional (dark theme, monospace for exam timer).