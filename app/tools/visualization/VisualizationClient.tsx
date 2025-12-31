'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import ExploreMoreTools from '@/components/ExploreMoreTools';
import PostResultUpsell from '@/components/PostResultUpsell';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  Node,
  Edge,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { toPng } from 'html-to-image';
import { Download, RefreshCw, AlertCircle, Sparkles, LayoutGrid, ChevronDown, ChevronUp } from 'lucide-react';
import { parseDiagramText, getLayoutedElements } from '@/lib/diagramParser';

const EXAMPLE_TEXT = `Landing Page
  > Lead Magnet
      > Email Sequence
  > Sales Page
Social Media Post
  > Short-Form Video
      > QR Code to Funnel
          > APE Paywall`;

function DiagramFlow({ 
  nodes, 
  edges, 
  onNodesChange, 
  onEdgesChange,
  onResetView,
  onToggleDirection,
  onDownloadPng,
  direction,
}: {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: any;
  onEdgesChange: any;
  onResetView: () => void;
  onToggleDirection: () => void;
  onDownloadPng: () => void;
  direction: 'LR' | 'TB';
}) {
  const { fitView } = useReactFlow();

  const handleResetView = useCallback(() => {
    fitView({ padding: 0.2, duration: 200 });
  }, [fitView]);

  return (
    <>
      {nodes.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleDirection}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
            >
              <LayoutGrid className="w-4 h-4" />
              {direction === 'LR' ? 'Left to Right' : 'Top to Bottom'}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetView}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Reset View
            </button>
            <button
              onClick={onDownloadPng}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
            >
              <Download className="w-4 h-4" />
              Download PNG
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 relative">
        {nodes.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            <p>Your diagram will appear here</p>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            defaultEdgeOptions={{
              type: 'smoothstep',
              markerEnd: { type: MarkerType.ArrowClosed },
            }}
          >
            <Controls />
            <Background color="#e7e5e4" gap={16} />
          </ReactFlow>
        )}
      </div>
    </>
  );
}

export default function VisualizationClient() {
  const [inputText, setInputText] = useState('');
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [direction, setDirection] = useState<'LR' | 'TB'>('LR');
  const [showSyntaxHelp, setShowSyntaxHelp] = useState(false);

  const generateDiagram = useCallback(() => {
    setError(null);
    
    const parsed = parseDiagramText(inputText);
    
    if (parsed.nodes.length === 0) {
      setError("We couldn't detect any lines. Try using the example format.");
      return;
    }

    const layouted = getLayoutedElements(parsed.nodes, parsed.edges, direction);
    setNodes(layouted.nodes as Node[]);
    setEdges(layouted.edges as Edge[]);
    setHasGenerated(true);
  }, [inputText, direction, setNodes, setEdges]);

  const useExample = () => {
    setInputText(EXAMPLE_TEXT);
    setError(null);
  };

  const downloadPng = useCallback(() => {
    const flowElement = document.querySelector('.react-flow') as HTMLElement;
    if (flowElement) {
      toPng(flowElement, {
        backgroundColor: '#fafaf9',
        quality: 1,
      }).then((dataUrl) => {
        const link = document.createElement('a');
        link.download = 'diagram.png';
        link.href = dataUrl;
        link.click();
      }).catch((err) => {
        console.error('Failed to download PNG:', err);
      });
    }
  }, []);

  const toggleDirection = useCallback(() => {
    const newDirection = direction === 'LR' ? 'TB' : 'LR';
    setDirection(newDirection);
    
    if (hasGenerated && nodes.length > 0) {
      const parsed = parseDiagramText(inputText);
      const layouted = getLayoutedElements(parsed.nodes, parsed.edges, newDirection);
      setNodes(layouted.nodes as Node[]);
      setEdges(layouted.edges as Edge[]);
    }
  }, [direction, hasGenerated, nodes.length, inputText, setNodes, setEdges]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Free Visualization Tool",
            "applicationCategory": "DesignApplication",
            "operatingSystem": "Any",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "Turn simple text into diagrams for funnels, workflows, and content systems. Free online visualization tool.",
            "featureList": [
              "Text to diagram conversion",
              "Funnel and workflow diagrams",
              "PNG export",
              "No signup required",
              "Runs in browser"
            ]
          })
        }}
      />

      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Free Visualization Tool
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Turn simple text into clean diagrams. Perfect for funnels, workflows, and content systems.
          </p>
          <p className="text-sm text-gray-400">
            Runs fully in your browser. No signup, no data stored.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-12">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 h-full">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter your structure as text
              </label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={EXAMPLE_TEXT}
                className="w-full h-64 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-gray-900 font-mono text-sm resize-y"
              />

              <button
                type="button"
                onClick={() => setShowSyntaxHelp(!showSyntaxHelp)}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mt-3 mb-2"
              >
                {showSyntaxHelp ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                Syntax help
              </button>

              {showSyntaxHelp && (
                <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm text-gray-600">
                  <ul className="space-y-1.5">
                    <li>• Each line becomes a node</li>
                    <li>• Indentation (2 spaces) creates hierarchy</li>
                    <li>• Use {"'>'"}  to indicate a child step (optional)</li>
                  </ul>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex gap-3 mt-4">
                <button
                  onClick={generateDiagram}
                  disabled={!inputText.trim()}
                  className="flex-1 py-3 px-4 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-gray-900 font-semibold rounded-xl transition-all"
                >
                  Generate Diagram
                </button>
                <button
                  onClick={useExample}
                  className="py-3 px-4 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-xl transition-all"
                >
                  Use Example
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden h-full min-h-[500px] flex flex-col">
              <ReactFlowProvider>
                <DiagramFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onResetView={() => {}}
                  onToggleDirection={toggleDirection}
                  onDownloadPng={downloadPng}
                  direction={direction}
                />
              </ReactFlowProvider>
            </div>
          </div>
        </div>

        {hasGenerated && nodes.length > 0 && (
          <PostResultUpsell />
        )}

        <div className="bg-gray-900 rounded-2xl p-8 md:p-10 text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            Turn Diagrams Into Real Funnels
          </h2>
          <p className="text-gray-300 mb-5 max-w-xl mx-auto">
            Visualized your funnel? APE Funnels helps you build landing pages, lead magnets, and payment systems to bring it to life.
          </p>
          <Link
            href="/store"
            className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-gray-900 font-semibold rounded-full transition-all"
          >
            <Sparkles className="w-5 h-5" />
            Explore APE Funnels
          </Link>
        </div>

        <div className="prose prose-stone max-w-none">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            What Is This Free Visualization Tool?
          </h2>
          <p className="text-gray-600 mb-4">
            This free visualization tool converts structured text into clean, professional diagrams. Simply type your ideas using indentation to show hierarchy, and the tool instantly generates a visual flowchart or diagram.
          </p>
          <p className="text-gray-600 mb-4">
            Use it for mapping out sales funnels, content workflows, business processes, or any system with steps and relationships. The diagram runs entirely in your browser—no signup, no account, and your data is never stored or sent anywhere.
          </p>
          <p className="text-gray-600 mb-8">
            Perfect for creators, marketers, and entrepreneurs who want to visualize their ideas quickly without learning complex diagramming software.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-10">
            How to Format Your Text for Diagrams
          </h2>
          <ul className="list-disc list-inside text-gray-600 mb-8 space-y-2">
            <li><strong>Each line becomes a node</strong> — Write one step or element per line</li>
            <li><strong>Use indentation for hierarchy</strong> — Indent with 2 spaces to create child elements</li>
            <li><strong>Optional arrow prefix</strong> — Start lines with {"'>'"}  to clearly show progression</li>
            <li><strong>Multiple root nodes</strong> — Start new branches at the left margin</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-10">
            Use Your Diagrams With VCM Tools
          </h2>
          <ul className="list-disc list-inside text-gray-600 mb-8 space-y-2">
            <li><strong>Turn diagrams into landing pages</strong> — Use APE Funnels to build each step of your funnel</li>
            <li><strong>Map out content funnels</strong> — Visualize how content leads to offers and sales</li>
            <li><strong>Connect offline to online</strong> — Use QR Social to link physical products to your funnel</li>
            <li><strong>Plan monetization flows</strong> — Design creator offers, subscriptions, and payment systems</li>
          </ul>
        </div>
      </main>

      <div className="max-w-6xl mx-auto px-4 mt-12">
        <ExploreMoreTools currentTool="/tools/visualization" />
      </div>

      <footer className="border-t border-gray-200 py-8 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>Part of the VCM creator tools. Need a full brand kit? Try APE Funnels.</p>
        </div>
      </footer>
    </>
  );
}
