import { toolsRegistry, type Tool } from '@/data/toolsRegistry';
import { CLOUD_IDS, ENTITLEMENT_TIERS } from '@/lib/types/cloudEntitlements';

export interface ValidationError {
  toolId: string;
  field: string;
  message: string;
}

export function validateToolsRegistry(): ValidationError[] {
  const errors: ValidationError[] = [];
  const cloudIdSet = new Set(CLOUD_IDS);
  const tierSet = new Set(ENTITLEMENT_TIERS);

  for (const tool of toolsRegistry) {
    if (!tool.cloud_id) {
      errors.push({
        toolId: tool.id,
        field: 'cloud_id',
        message: `Tool "${tool.id}" is missing cloud_id`
      });
    } else if (!cloudIdSet.has(tool.cloud_id)) {
      errors.push({
        toolId: tool.id,
        field: 'cloud_id',
        message: `Tool "${tool.id}" has invalid cloud_id: "${tool.cloud_id}"`
      });
    }

    if (!tool.required_tier) {
      errors.push({
        toolId: tool.id,
        field: 'required_tier',
        message: `Tool "${tool.id}" is missing required_tier`
      });
    } else if (!tierSet.has(tool.required_tier)) {
      errors.push({
        toolId: tool.id,
        field: 'required_tier',
        message: `Tool "${tool.id}" has invalid required_tier: "${tool.required_tier}"`
      });
    }

    if (!tool.slug) {
      errors.push({
        toolId: tool.id,
        field: 'slug',
        message: `Tool "${tool.id}" is missing slug`
      });
    }
  }

  return errors;
}

export function assertValidToolsRegistry(): void {
  const errors = validateToolsRegistry();
  
  if (errors.length > 0) {
    const errorMessages = errors.map(e => `  - ${e.message}`).join('\n');
    throw new Error(`Tools registry validation failed:\n${errorMessages}`);
  }
}

export function logValidationWarnings(): void {
  const errors = validateToolsRegistry();
  
  if (errors.length > 0 && process.env.NODE_ENV === 'development') {
    console.warn('[ToolsRegistry] Validation warnings:');
    for (const error of errors) {
      console.warn(`  - ${error.message}`);
    }
  }
}

export function getToolBySlug(slug: string): Tool | undefined {
  return toolsRegistry.find(t => t.slug === slug);
}

export function getToolById(id: string): Tool | undefined {
  return toolsRegistry.find(t => t.id === id);
}
