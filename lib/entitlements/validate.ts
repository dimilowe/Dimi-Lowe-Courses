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
    if (!tool.cloud_ids) {
      errors.push({
        toolId: tool.id,
        field: 'cloud_ids',
        message: `Tool "${tool.id}" is missing cloud_ids`
      });
    } else if (!Array.isArray(tool.cloud_ids)) {
      errors.push({
        toolId: tool.id,
        field: 'cloud_ids',
        message: `Tool "${tool.id}" cloud_ids must be an array`
      });
    } else if (tool.cloud_ids.length === 0 && tool.required_tier !== 'free') {
      errors.push({
        toolId: tool.id,
        field: 'cloud_ids',
        message: `Tool "${tool.id}" has non-free tier but empty cloud_ids (misconfigured)`
      });
    } else {
      for (const cloudId of tool.cloud_ids) {
        if (!cloudIdSet.has(cloudId)) {
          errors.push({
            toolId: tool.id,
            field: 'cloud_ids',
            message: `Tool "${tool.id}" has invalid cloud_id in array: "${cloudId}"`
          });
        }
      }
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
