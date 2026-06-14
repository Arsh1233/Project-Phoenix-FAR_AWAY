# Project PHOENIX - Secure Examination System

A React + TypeScript frontend for the PHOENIX secure examination platform featuring biometric authentication, keystroke behavioral fingerprinting, and real-time WebSocket communication for secure fragment management.

## Features

### Biometric Authentication
- **Face Capture**: Webcam-based facial recognition using `react-webcam`
- **Fingerprint Simulation**: Generates secure SHA-256 hash for demo purposes
- **Secure Token Storage**: JWT tokens stored in localStorage with expiration

### Secure Examination
- **Question Fragmentation**: Each question loaded as a fragment from Edge Agent
- **Keystroke Logging**: Behavioral fingerprinting via timing analysis (sent every 10s)
- **Real-time Regeneration**: WebSocket-triggered fragment reload on security events

### Exam Health Indicator
- **Green**: All fragments valid, connection stable
- **Yellow**: Regeneration in progress
- **Red**: Connection lost or critical error

### Developer Tools
- **Simulate Regeneration**: Manually trigger fragment reload
- **Simulate Leak**: Test security breach response

## Tech Stack

- **Framework**: React 18 + TypeScript
- **Bundler**: Vite 5
- **Styling**: TailwindCSS 3.4
- **Webcam**: react-webcam
- **HTTP Client**: Axios
- **WebSocket**: Native WebSocket API

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Login.tsx          # Biometric authentication
│   │   └── ExamScreen.tsx     # Question display + keystroke logging
│   ├── hooks/
│   │   └── useWebSocket.ts    # WebSocket connection + health monitoring
│   ├── services/
│   │   └── api.ts             # REST API client
│   ├── types/
│   │   └── index.ts           # TypeScript interfaces
│   ├── App.tsx                # Main app + state management
│   ├── index.css              # Global styles + animations
│   └── main.tsx               # Entry point
├── public/
│   └── phoenix.svg            # App icon
├── .env                       # Environment variables
├── .env.example               # Env template
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your API endpoints
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open browser**
   Navigate to `http://localhost:3000`

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | REST API base URL | `http://localhost:8080/api` |
| `VITE_WS_URL` | WebSocket server URL | `ws://localhost:8080` |
| `VITE_MOCK_API` | Use mock responses | `true` |

## Usage Guide

### Authentication Flow

1. **Face Capture**: Click "Capture" to take a webcam photo with animated scan effect
2. **Fingerprint**: Click the fingerprint area to generate a simulated hash
3. **Login**: Submit to authenticate and receive JWT token

### During Examination

1. **Question Display**: One question shown at a time from Edge Agent fragments
2. **Answer Selection**: Click an option (A/B/C/D) to select
3. **Keystroke Tracking**: All keypress timing logged for behavioral analysis
4. **Next Question**: Submit answer and advance

### WebSocket Events

The system listens for:
- **regenerate**: Trigger fragment reload for specified question
- **health**: System status updates
- **error**: Connection or security issues

### Developer Controls

When `import.meta.env.DEV` is true and exam is active:
- **Regenerate**: Manually trigger fragment reload
- **Simulate Leak**: Test security breach handling

## API Endpoints

### Authentication
```
POST /api/auth
Body: { faceImage: base64, fingerprintHash: string, timestamp: number }
Response: { token: string, sessionId: string, expiresAt: number }
```

### Questions
```
GET /api/questions/:index
Headers: Authorization: Bearer <token>, X-Session-Id: <sessionId>
Response: Question object
```

### Answers
```
POST /api/answers
Body: { questionId: string, answer: string, sessionId: string }
```

### Keystroke Data
```
POST /api/fingerprint/verify
Body: KeystrokeData object
```

### Fragment Regeneration
```
POST /api/fragments/regenerate
Body: { questionId: string, reason: string }
Response: Question object
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Note**: Webcam access requires secure context (HTTPS or localhost).

## Troubleshooting

### Webcam not working
- Ensure HTTPS or localhost
- Check browser permissions
- Try refreshing the page

### WebSocket connection failed
- Verify `VITE_WS_URL` in .env
- Check if WebSocket server is running
- Check firewall settings

### API requests failing
- Verify `VITE_API_URL` in .env
- Check if backend is running
- Check browser console for CORS errors

## License

MIT License - See LICENSE file for details

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## Support

For issues and feature requests, please use the GitHub issue tracker.
