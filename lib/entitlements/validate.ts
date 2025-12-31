import { CLOUD_IDS, ENTITLEMENT_TIERS, type CloudId, type EntitlementTier } from '@/lib/types/cloudEntitlements';

export interface ValidationError {
  toolId: string;
  field: string;
  message: string;
}

export interface ValidatableTool {
  id: string;
  slug?: string;
  cloud_ids?: CloudId[];
  required_tier?: EntitlementTier;
}

export function validateToolsRegistry(registry: ValidatableTool[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const cloudIdSet = new Set(CLOUD_IDS);
  const tierSet = new Set(ENTITLEMENT_TIERS);

  for (const tool of registry) {
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

export function assertValidToolsRegistry(registry: ValidatableTool[]): void {
  const errors = validateToolsRegistry(registry);
  
  if (errors.length > 0) {
    const errorMessages = errors.map(e => `  - ${e.message}`).join('\n');
    throw new Error(`Tools registry validation failed:\n${errorMessages}`);
  }
}
