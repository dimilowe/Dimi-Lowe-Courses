import { EngineType, InputType, OutputType, toolsRegistry } from "@/data/toolsRegistry";

export type { EngineType, InputType, OutputType };

export type HeavyMode = 'none' | 'single' | 'multi';

export interface EngineConfig {
  id: EngineType;
  name: string;
  description: string;
  inputTypes: InputType[];
  outputTypes: OutputType[];
  sharedComponent?: string;
  presetsFile?: string;
  apiRoutes?: string[];
  capabilities: string[];
  heavyMode?: HeavyMode;
  hasAi?: boolean;
}

export const ENGINE_REGISTRY: Record<EngineType, EngineConfig> = {
  "platform-resizer": {
    id: "platform-resizer",
    name: "Platform Image Resizer",
    description: "Resize images to platform-specific dimensions",
    inputTypes: ["image"],
    outputTypes: ["image"],
    sharedComponent: "components/PlatformImageToolClient.tsx",
    presetsFile: "data/platformImagePresets.ts",
    apiRoutes: ["/api/platform-image/resize"],
    capabilities: ["resize", "crop", "format-convert"],
    heavyMode: "single",
  },
  "image-compress": {
    id: "image-compress",
    name: "Image Compression",
    description: "Compress images to reduce file size",
    inputTypes: ["image"],
    outputTypes: ["download"],
    capabilities: ["compress", "optimize", "batch"],
    heavyMode: "single",
  },
  "image-convert": {
    id: "image-convert",
    name: "Image Format Converter",
    description: "Convert between image formats",
    inputTypes: ["image", "multi"],
    outputTypes: ["download"],
    capabilities: ["convert", "batch", "format-change"],
    heavyMode: "multi",
  },
  "text-transform": {
    id: "text-transform",
    name: "Text Transformation",
    description: "Transform and manipulate text",
    inputTypes: ["text"],
    outputTypes: ["text"],
    capabilities: ["transform", "format", "generate"],
    heavyMode: "none",
  },
  "text-analysis": {
    id: "text-analysis",
    name: "Text Analysis",
    description: "Analyze text for metrics and insights",
    inputTypes: ["text"],
    outputTypes: ["analysis"],
    capabilities: ["count", "analyze", "metrics"],
    heavyMode: "none",
  },
  "calculator": {
    id: "calculator",
    name: "Calculator Engine",
    description: "Numerical calculations and estimations",
    inputTypes: ["number", "selection"],
    outputTypes: ["analysis"],
    capabilities: ["calculate", "estimate", "project"],
    heavyMode: "none",
  },
  "ai-analysis": {
    id: "ai-analysis",
    name: "AI Analysis",
    description: "AI-powered content analysis",
    inputTypes: ["text", "image", "url"],
    outputTypes: ["analysis", "text", "display"],
    capabilities: ["analyze", "score", "recommend"],
    heavyMode: "single",
    hasAi: true,
  },
  "ai-generate": {
    id: "ai-generate",
    name: "AI Generation",
    description: "AI-powered content generation",
    inputTypes: ["text", "selection"],
    outputTypes: ["text", "image", "display", "download"],
    capabilities: ["generate", "create", "compose"],
    heavyMode: "single",
    hasAi: true,
  },
  "file-convert": {
    id: "file-convert",
    name: "File Converter",
    description: "Convert between file formats",
    inputTypes: ["file"],
    outputTypes: ["download"],
    capabilities: ["convert", "extract", "merge"],
    heavyMode: "multi",
  },
  "file-edit": {
    id: "file-edit",
    name: "File Editor",
    description: "Edit and manipulate files",
    inputTypes: ["file"],
    outputTypes: ["download"],
    capabilities: ["edit", "rearrange", "modify"],
    heavyMode: "single",
  },
  "community": {
    id: "community",
    name: "Community Tools",
    description: "User-generated and community-driven tools",
    inputTypes: ["selection", "text"],
    outputTypes: ["interactive", "text"],
    capabilities: ["browse", "submit", "vote"],
    heavyMode: "none",
  },
  "static": {
    id: "static",
    name: "Static Reference",
    description: "Reference guides and documentation",
    inputTypes: ["none"],
    outputTypes: ["display"],
    capabilities: ["reference", "guide", "lookup"],
    heavyMode: "none",
  },
  "standalone": {
    id: "standalone",
    name: "Standalone Tools",
    description: "Custom one-off tools with unique logic",
    inputTypes: ["multi", "text", "image"],
    outputTypes: ["interactive", "image", "text", "display"],
    capabilities: ["custom"],
    heavyMode: "none",
  },
  "zip": {
    id: "zip",
    name: "ZIP Archive Engine",
    description: "Create and manage ZIP archives client-side",
    inputTypes: ["file", "multi"],
    outputTypes: ["download"],
    sharedComponent: "components/engines/ZipEngine.tsx",
    presetsFile: "engines/zip/config.ts",
    capabilities: ["compress", "archive", "bundle"],
    heavyMode: "multi",
  },
  "outfit": {
    id: "outfit",
    name: "Outfit Analyzer Engine",
    description: "AI-powered outfit analysis and shopping recommendations",
    inputTypes: ["image"],
    outputTypes: ["analysis", "display"],
    sharedComponent: "components/engines/OutfitEngine.tsx",
    presetsFile: "engines/outfit/config.ts",
    apiRoutes: ["/api/tools/outfit-analyzer"],
    capabilities: ["analyze", "recommend", "shop"],
    heavyMode: "single",
  },
  "price-engine": {
    id: "price-engine",
    name: "Price Tracker Engine",
    description: "Track and monitor product prices across retailers",
    inputTypes: ["url", "text"],
    outputTypes: ["analysis", "display"],
    sharedComponent: "components/engines/PriceEngine.tsx",
    presetsFile: "engines/price-engine/config.ts",
    capabilities: ["track", "monitor", "compare", "alert"],
    heavyMode: "single",
  }
};

export function getEngineById(id: EngineType): EngineConfig | undefined {
  return ENGINE_REGISTRY[id];
}

export function getEnginesByCapability(capability: string): EngineConfig[] {
  return Object.values(ENGINE_REGISTRY).filter(
    engine => engine.capabilities.includes(capability)
  );
}

export function getToolCountByEngine(engineType: EngineType): number {
  return toolsRegistry.filter(tool => tool.engineType === engineType).length;
}

export function getEngineStats(): { 
  engineCount: number; 
  toolCount: number; 
  capabilities: string[];
  toolsByEngine: Record<string, number>;
} {
  const allCapabilities = new Set<string>();
  const toolsByEngine: Record<string, number> = {};
  
  Object.values(ENGINE_REGISTRY).forEach(engine => {
    engine.capabilities.forEach(cap => allCapabilities.add(cap));
    toolsByEngine[engine.id] = getToolCountByEngine(engine.id);
  });
  
  return {
    engineCount: Object.keys(ENGINE_REGISTRY).length,
    toolCount: toolsRegistry.length,
    capabilities: Array.from(allCapabilities),
    toolsByEngine
  };
}

export function validateToolEngineConsistency(): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  toolsRegistry.forEach(tool => {
    const engine = ENGINE_REGISTRY[tool.engineType];
    if (!engine) {
      issues.push(`Tool "${tool.name}" has unknown engine type: ${tool.engineType}`);
      return;
    }
    
    if (!engine.inputTypes.includes(tool.inputType)) {
      issues.push(`Tool "${tool.name}" inputType "${tool.inputType}" not in engine "${tool.engineType}" inputTypes`);
    }
    
    if (!engine.outputTypes.includes(tool.outputType)) {
      issues.push(`Tool "${tool.name}" outputType "${tool.outputType}" not in engine "${tool.engineType}" outputTypes`);
    }
  });
  
  return { valid: issues.length === 0, issues };
}
