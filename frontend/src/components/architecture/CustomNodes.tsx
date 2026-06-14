import { Handle, Position } from '@xyflow/react';

export const CandidateNode = () => {
  return (
    <div className="bg-orange-50/90 backdrop-blur border-2 border-orange-200 rounded-xl p-5 shadow-lg w-[450px]">
      <h4 className="text-orange-800 font-semibold mb-4 flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
        Candidate (Exam Center)
      </h4>
      <div className="flex gap-4">
        <div className="flex-1 bg-white p-4 rounded-lg border border-orange-100 shadow-sm relative">
          {/* Incoming from AI */}
          <Handle type="target" position={Position.Right} id="front-in-right" className="w-2 h-2 bg-orange-500 border-none" style={{ top: '20%' }} />
          {/* Outgoing to Edge (REST) */}
          <Handle type="source" position={Position.Bottom} id="front-out-bottom" className="w-2 h-2 bg-orange-500 border-none" style={{ left: '20%' }} />
          {/* Incoming from Edge (WebSocket) */}
          <Handle type="target" position={Position.Bottom} id="front-in-bottom" className="w-2 h-2 bg-orange-500 border-none" style={{ left: '80%' }} />
          
          <div className="font-semibold text-ink-900 text-sm">React Frontend</div>
          <div className="text-xs text-ink-500 mt-1">Face + Fingerprint + Keystrokes</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-orange-100 shadow-sm relative">
          {/* Outgoing to AI (Webcam) */}
          <Handle type="source" position={Position.Right} id="webcam-out-right" className="w-2 h-2 bg-orange-500 border-none" style={{ top: '80%' }} />
          <div className="font-semibold text-ink-900 text-sm text-center">Webcam API</div>
        </div>
      </div>
    </div>
  );
};

export const EdgeNode = () => {
  return (
    <div className="bg-green-50/90 backdrop-blur border-2 border-green-200 rounded-xl p-5 shadow-lg w-[450px]">
      <h4 className="text-green-800 font-semibold mb-4 flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
        Edge Agent (Per Center)
      </h4>
      <div className="space-y-4">
        <div className="bg-white p-4 rounded-lg border border-green-100 shadow-sm relative">
          {/* Incoming from Frontend */}
          <Handle type="target" position={Position.Top} id="flask-in-top" className="w-2 h-2 bg-green-500 border-none" style={{ left: '20%' }} />
          {/* Outgoing to Crypto */}
          <Handle type="source" position={Position.Right} id="flask-out-right" className="w-2 h-2 bg-green-500 border-none" style={{ top: '50%' }} />
          <div className="font-semibold text-ink-900 text-sm">Flask API</div>
          <div className="text-xs text-ink-500">Session Mgmt & Caching</div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg border border-green-100 shadow-sm relative">
            <div className="font-semibold text-ink-900 text-sm">Redis Cache</div>
            <div className="text-xs text-ink-500">Fragment Assembly</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-green-100 shadow-sm relative">
            {/* Outgoing to Frontend (Regenerate) */}
            <Handle type="source" position={Position.Top} id="ws-out-top" className="w-2 h-2 bg-green-500 border-none" style={{ left: '80%' }} />
            {/* Incoming from AI */}
            <Handle type="target" position={Position.Right} id="ws-in-right" className="w-2 h-2 bg-green-500 border-none" style={{ top: '20%' }} />
            {/* Incoming from Scraper */}
            <Handle type="target" position={Position.Right} id="ws-in-right-2" className="w-2 h-2 bg-green-500 border-none" style={{ top: '80%' }} />
            <div className="font-semibold text-ink-900 text-sm">WebSocket Server</div>
            <div className="text-xs text-ink-500">Regen Events</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const CloudNode = () => {
  return (
    <div className="bg-blue-50/90 backdrop-blur border-2 border-blue-200 rounded-xl p-5 shadow-lg w-[400px]">
      <h4 className="text-blue-800 font-semibold mb-4 flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
        Cloud / Backend
      </h4>
      <div className="space-y-4">
        <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm relative">
          {/* Incoming from Flask */}
          <Handle type="target" position={Position.Left} id="crypto-in-left" className="w-2 h-2 bg-blue-500 border-none" style={{ top: '50%' }} />
          {/* Outgoing to Blockchain */}
          <Handle type="source" position={Position.Right} id="crypto-out-right" className="w-2 h-2 bg-blue-500 border-none" style={{ top: '50%' }} />
          <div className="font-semibold text-ink-900 text-sm">Crypto Service</div>
          <div className="text-xs text-ink-500">Shamir + Time-Lock</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm relative">
          {/* Incoming from Webcam */}
          <Handle type="target" position={Position.Left} id="ai-in-left" className="w-2 h-2 bg-blue-500 border-none" style={{ top: '80%' }} />
          {/* Outgoing to Frontend */}
          <Handle type="source" position={Position.Left} id="ai-out-left-front" className="w-2 h-2 bg-blue-500 border-none" style={{ top: '20%' }} />
          {/* Outgoing to WS */}
          <Handle type="source" position={Position.Bottom} id="ai-out-bottom-ws" className="w-2 h-2 bg-blue-500 border-none" style={{ left: '20%' }} />
          {/* Outgoing to Blockchain */}
          <Handle type="source" position={Position.Right} id="ai-out-right-chain" className="w-2 h-2 bg-blue-500 border-none" style={{ top: '50%' }} />
          <div className="font-semibold text-ink-900 text-sm">AI Service</div>
          <div className="text-xs text-ink-500">Leak Detection + Fingerprint</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm relative">
          {/* Incoming from Crypto & AI */}
          <Handle type="target" position={Position.Right} id="chain-in-right" className="w-2 h-2 bg-blue-500 border-none" style={{ top: '20%' }} />
          <Handle type="target" position={Position.Right} id="chain-in-right-2" className="w-2 h-2 bg-blue-500 border-none" style={{ top: '80%' }} />
          <div className="font-semibold text-ink-900 text-sm">Blockchain Audit</div>
          <div className="text-xs text-ink-500">Hyperledger Mock</div>
        </div>
      </div>
    </div>
  );
};

export const MonitorNode = () => {
  return (
    <div className="bg-red-50/90 backdrop-blur border-2 border-red-200 rounded-xl p-5 shadow-lg w-[400px]">
      <h4 className="text-red-800 font-semibold mb-4 flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
        External Monitors
      </h4>
      <div className="bg-white p-4 rounded-lg border border-red-100 shadow-sm relative">
        <Handle type="source" position={Position.Left} id="scraper-out-left" className="w-2 h-2 bg-red-500 border-none" style={{ top: '50%' }} />
        <div className="font-semibold text-ink-900 text-sm">Dark Web Scraper</div>
        <div className="text-xs text-ink-500">Hash Match Monitoring</div>
      </div>
    </div>
  );
};
