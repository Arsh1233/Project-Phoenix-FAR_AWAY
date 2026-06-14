import React, { useMemo } from 'react';
import { ReactFlow, Background, MarkerType, type Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { CandidateNode, EdgeNode, CloudNode, MonitorNode } from './CustomNodes';

const nodeTypes = {
  candidate: CandidateNode,
  edge: EdgeNode,
  cloud: CloudNode,
  monitor: MonitorNode,
};

const initialNodes = [
  { id: 'candidate', type: 'candidate', position: { x: 50, y: 50 }, data: {} },
  { id: 'edge', type: 'edge', position: { x: 50, y: 450 }, data: {} },
  { id: 'cloud', type: 'cloud', position: { x: 750, y: 50 }, data: {} },
  { id: 'monitor', type: 'monitor', position: { x: 750, y: 500 }, data: {} },
];

const initialEdges: Edge[] = [
  // React Frontend -> Flask API
  { 
    id: 'e1', source: 'candidate', sourceHandle: 'front-out-bottom', target: 'edge', targetHandle: 'flask-in-top', 
    label: 'REST /auth, /exam/next', animated: true, 
    markerEnd: { type: MarkerType.ArrowClosed, color: '#f97316' },
    style: { stroke: '#f97316', strokeWidth: 2 },
    zIndex: 50,
    labelBgPadding: [8, 4],
    labelBgBorderRadius: 4,
    labelBgStyle: { fill: '#ffffff', fillOpacity: 0.9, stroke: '#f97316' },
  },
  // Webcam -> AI
  { 
    id: 'e2', source: 'candidate', sourceHandle: 'webcam-out-right', target: 'cloud', targetHandle: 'ai-in-left', 
    label: 'face base64', animated: true,
    markerEnd: { type: MarkerType.ArrowClosed, color: '#f97316' },
    style: { stroke: '#f97316', strokeWidth: 2 },
    zIndex: 50,
    labelBgPadding: [8, 4],
    labelBgBorderRadius: 4,
    labelBgStyle: { fill: '#ffffff', fillOpacity: 0.9, stroke: '#f97316' },
  },
  // AI -> React Frontend
  { 
    id: 'e3', source: 'cloud', sourceHandle: 'ai-out-left-front', target: 'candidate', targetHandle: 'front-in-right', 
    label: 'fingerprint verify', animated: true,
    markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' },
    style: { stroke: '#3b82f6', strokeWidth: 2 },
    zIndex: 50,
    labelBgPadding: [8, 4],
    labelBgBorderRadius: 4,
    labelBgStyle: { fill: '#ffffff', fillOpacity: 0.9, stroke: '#3b82f6' },
  },
  // Flask -> Crypto
  { 
    id: 'e4', source: 'edge', sourceHandle: 'flask-out-right', target: 'cloud', targetHandle: 'crypto-in-left', 
    label: 'get fragments', animated: true,
    markerEnd: { type: MarkerType.ArrowClosed, color: '#22c55e' },
    style: { stroke: '#22c55e', strokeWidth: 2 },
    zIndex: 50,
    labelBgPadding: [8, 4],
    labelBgBorderRadius: 4,
    labelBgStyle: { fill: '#ffffff', fillOpacity: 0.9, stroke: '#22c55e' },
  },
  // Crypto -> Blockchain
  { 
    id: 'e5', source: 'cloud', sourceHandle: 'crypto-out-right', target: 'cloud', targetHandle: 'chain-in-right', 
    label: 'log access', animated: true, type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' },
    style: { stroke: '#3b82f6', strokeWidth: 2 },
    zIndex: 50,
    labelBgPadding: [8, 4],
    labelBgBorderRadius: 4,
    labelBgStyle: { fill: '#ffffff', fillOpacity: 0.9, stroke: '#3b82f6' },
  },
  // AI -> Blockchain
  { 
    id: 'e6', source: 'cloud', sourceHandle: 'ai-out-right-chain', target: 'cloud', targetHandle: 'chain-in-right-2', 
    animated: true, type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' },
    style: { stroke: '#3b82f6', strokeWidth: 2 },
    zIndex: 50,
  },
  // AI -> WebSocket
  { 
    id: 'e7', source: 'cloud', sourceHandle: 'ai-out-bottom-ws', target: 'edge', targetHandle: 'ws-in-right', 
    label: 'leak alert', animated: true, type: 'bezier',
    markerEnd: { type: MarkerType.ArrowClosed, color: '#ef4444' },
    style: { stroke: '#ef4444', strokeWidth: 2 },
    zIndex: 50,
    labelBgPadding: [8, 4],
    labelBgBorderRadius: 4,
    labelBgStyle: { fill: '#ffffff', fillOpacity: 0.9, stroke: '#ef4444' },
  },
  // Scraper -> WebSocket
  { 
    id: 'e8', source: 'monitor', sourceHandle: 'scraper-out-left', target: 'edge', targetHandle: 'ws-in-right-2', 
    label: 'hash match', animated: true, type: 'bezier',
    markerEnd: { type: MarkerType.ArrowClosed, color: '#ef4444' },
    style: { stroke: '#ef4444', strokeWidth: 2 },
    zIndex: 50,
    labelBgPadding: [8, 4],
    labelBgBorderRadius: 4,
    labelBgStyle: { fill: '#ffffff', fillOpacity: 0.9, stroke: '#ef4444' },
  },
  // WebSocket -> React Frontend
  { 
    id: 'e9', source: 'edge', sourceHandle: 'ws-out-top', target: 'candidate', targetHandle: 'front-in-bottom', 
    label: 'regenerate', animated: true,
    markerEnd: { type: MarkerType.ArrowClosed, color: '#22c55e' },
    style: { stroke: '#22c55e', strokeWidth: 2 },
    zIndex: 50,
    labelBgPadding: [8, 4],
    labelBgBorderRadius: 4,
    labelBgStyle: { fill: '#ffffff', fillOpacity: 0.9, stroke: '#22c55e' },
  },
];

export const ArchitectureFlow: React.FC = () => {
  const nodeTypesMemo = useMemo(() => nodeTypes, []);

  return (
    <div className="w-full h-[850px] bg-white rounded-xl border border-surface-200">
      <ReactFlow
        nodes={initialNodes}
        edges={initialEdges}
        nodeTypes={nodeTypesMemo}
        fitView
        attributionPosition="bottom-right"
        className="bg-surface-50"
      >
        <Background color="#ccc" gap={16} />
      </ReactFlow>
    </div>
  );
};
