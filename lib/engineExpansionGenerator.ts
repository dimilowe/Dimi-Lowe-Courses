import { query, withTransaction } from "./db";
import {
  EngineBlueprint,
  GeneratedShell,
  ExpansionResult,
  generateAllShells,
  getBlueprint,
  getAllBlueprints,
  generateArticleSlugsFromPatterns,
} from "./engineBlueprint";
import { getClusterById } from "@/data/clusterRegistry";

export async function runExpansion(blueprintId: string): Promise<ExpansionResult> {
  const blueprint = getBlueprint(blueprintId);
  
  if (!blueprint) {
    return {
      engineId: blueprintId,
      createdCount: 0,
      skippedCount: 0,
      created: [],
      skipped: [],
      errors: [`Blueprint not found: ${blueprintId}`],
      warnings: [],
      missingClusters: [],
      generatedArticleSlugs: [],
    };
  }
  
  return expandBlueprint(blueprint);
}

export async function expandBlueprint(blueprint: EngineBlueprint): Promise<ExpansionResult> {
  const shells = generateAllShells(blueprint);
  
  let generatedArticleSlugs: string[] = [];
  let clusterSlug: string | undefined;
  
  if (blueprint.clusterConfig) {
    generatedArticleSlugs = generateArticleSlugsFromPatterns(blueprint.clusterConfig);
    clusterSlug = blueprint.clusterConfig.clusterSlug;
  }
  
  const result: ExpansionResult = {
    engineId: blueprint.id,
    createdCount: 0,
    skippedCount: 0,
    created: [],
    skipped: [],
    errors: [],
    warnings: [],
    missingClusters: [],
    generatedArticleSlugs,
    clusterSlug,
  };
  
  if (shells.length === 0) {
    return result;
  }
  
  const referencedClusters = new Set<string>();
  for (const shell of shells) {
    if (shell.clusterSlug) {
      referencedClusters.add(shell.clusterSlug);
    }
  }
  
  for (const clusterSlug of referencedClusters) {
    const cluster = getClusterById(clusterSlug);
    if (!cluster) {
      result.missingClusters.push(clusterSlug);
      result.warnings.push(`Cluster "${clusterSlug}" is referenced but not defined in clusterRegistry.ts`);
    }
  }
  
  try {
    const slugs = shells.map(s => s.slug);
    const existingResult = await query(
      `SELECT slug FROM tools WHERE slug = ANY($1)`,
      [slugs]
    );
    const existingSlugs = new Set((existingResult.rows as { slug: string }[]).map(r => r.slug));
    
    const toInsert: GeneratedShell[] = [];
    for (const shell of shells) {
      if (existingSlugs.has(shell.slug)) {
        result.skippedCount++;
        result.skipped.push(shell.slug);
      } else {
        toInsert.push(shell);
      }
    }
    
    await withTransaction(async (tx) => {
      if (toInsert.length > 0) {
        for (const shell of toInsert) {
          await tx.query(
            `INSERT INTO tools (
              slug, name, description, engine, cluster, segment, status, 
              link_status, is_indexed, in_directory, featured, 
              blueprint_id, dimensions, link_rules
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
            [
              shell.slug,
              shell.name,
              shell.metaDescription || '',
              shell.engineType,
              shell.clusterSlug || null,
              shell.segment || 'secondary',
              'draft',
              'Not Ready',
              false,
              false,
              false,
              blueprint.id,
              JSON.stringify(shell.dimensions || {}),
              JSON.stringify(shell.linkRules || {}),
            ]
          );
          result.createdCount++;
          result.created.push(shell.slug);
        }
      }
      
      if (blueprint.clusterConfig && generatedArticleSlugs.length > 0) {
        const existingArticles = await tx.query(
          `SELECT slug FROM cluster_articles WHERE slug = ANY($1)`,
          [generatedArticleSlugs]
        );
        const existingArticleSlugs = new Set((existingArticles.rows as { slug: string }[]).map((r) => r.slug));
        
        for (const articleSlug of generatedArticleSlugs) {
          if (!existingArticleSlugs.has(articleSlug)) {
            const title = articleSlug
              .split("-")
              .map(w => w.charAt(0).toUpperCase() + w.slice(1))
              .join(" ");
            
            await tx.query(
              `INSERT INTO cluster_articles (
                slug, title, content, excerpt, meta_description, 
                cluster_slug, is_indexed, is_published, created_at, updated_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
              [
                articleSlug,
                title,
                '',
                '',
                '',
                blueprint.clusterConfig!.clusterSlug,
                false,
                false,
              ]
            );
          }
        }
      }
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    result.errors.push(`Database error: ${errorMessage}`);
    console.error("Expansion error:", error);
  }
  
  return result;
}

export async function expandAllBlueprints(): Promise<ExpansionResult[]> {
  const blueprints = getAllBlueprints();
  const results: ExpansionResult[] = [];
  for (const bp of blueprints) {
    const result = await expandBlueprint(bp);
    results.push(result);
  }
  return results;
}

export async function getToolFromDb(slug: string): Promise<any | null> {
  try {
    const result = await query(
      `SELECT * FROM tools WHERE slug = $1`,
      [slug]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error("Error fetching tool:", error);
    return null;
  }
}

export async function getAllToolsFromDb(): Promise<any[]> {
  try {
    const result = await query(
      `SELECT * FROM tools ORDER BY created_at DESC`
    );
    return result.rows;
  } catch (error) {
    console.error("Error fetching tools:", error);
    return [];
  }
}

export async function getToolsByEngine(engineId: string): Promise<any[]> {
  try {
    const result = await query(
      `SELECT * FROM tools WHERE engine = $1 ORDER BY created_at DESC`,
      [engineId]
    );
    return result.rows;
  } catch (error) {
    console.error("Error fetching tools by engine:", error);
    return [];
  }
}

export async function getToolsByCluster(clusterSlug: string): Promise<any[]> {
  try {
    const result = await query(
      `SELECT * FROM tools WHERE cluster = $1 ORDER BY created_at DESC`,
      [clusterSlug]
    );
    return result.rows;
  } catch (error) {
    console.error("Error fetching tools by cluster:", error);
    return [];
  }
}

export async function getToolsByStatus(status: string): Promise<any[]> {
  try {
    const result = await query(
      `SELECT * FROM tools WHERE status = $1 ORDER BY created_at DESC`,
      [status]
    );
    return result.rows;
  } catch (error) {
    console.error("Error fetching tools by status:", error);
    return [];
  }
}

export async function updateToolStatus(
  slug: string,
  updates: { status?: string; is_indexed?: boolean; in_directory?: boolean; link_status?: string }
): Promise<boolean> {
  try {
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    if (updates.status !== undefined) {
      setClauses.push(`status = $${paramIndex++}`);
      values.push(updates.status);
    }
    if (updates.is_indexed !== undefined) {
      setClauses.push(`is_indexed = $${paramIndex++}`);
      values.push(updates.is_indexed);
    }
    if (updates.in_directory !== undefined) {
      setClauses.push(`in_directory = $${paramIndex++}`);
      values.push(updates.in_directory);
    }
    if (updates.link_status !== undefined) {
      setClauses.push(`link_status = $${paramIndex++}`);
      values.push(updates.link_status);
    }
    
    if (setClauses.length === 0) {
      return false;
    }
    
    setClauses.push(`updated_at = NOW()`);
    values.push(slug);
    
    const result = await query(
      `UPDATE tools SET ${setClauses.join(', ')} WHERE slug = $${paramIndex}`,
      values
    );
    
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error("Error updating tool status:", error);
    return false;
  }
}

export async function bulkUpdateToolStatus(
  slugs: string[],
  updates: { status?: string; is_indexed?: boolean; in_directory?: boolean; link_status?: string }
): Promise<{ updated: number; failed: number }> {
  let updated = 0;
  let failed = 0;
  
  for (const slug of slugs) {
    const success = await updateToolStatus(slug, updates);
    if (success) {
      updated++;
    } else {
      failed++;
    }
  }
  
  return { updated, failed };
}

export async function deleteTool(slug: string): Promise<boolean> {
  try {
    const result = await query(
      `DELETE FROM tools WHERE slug = $1`,
      [slug]
    );
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error("Error deleting tool:", error);
    return false;
  }
}

export async function getExpansionStats(): Promise<{
  totalShells: number;
  byEngine: Record<string, number>;
  byStatus: Record<string, number>;
  byCluster: Record<string, number>;
}> {
  try {
    const totalResult = await query(`SELECT COUNT(*) as count FROM tools`);
    const engineResult = await query(
      `SELECT engine, COUNT(*) as count FROM tools GROUP BY engine`
    );
    const statusResult = await query(
      `SELECT status, COUNT(*) as count FROM tools GROUP BY status`
    );
    const clusterResult = await query(
      `SELECT cluster, COUNT(*) as count FROM tools WHERE cluster IS NOT NULL GROUP BY cluster`
    );
    
    const byEngine: Record<string, number> = {};
    for (const row of engineResult.rows) {
      if (row.engine) {
        byEngine[row.engine as string] = parseInt(row.count as string);
      }
    }
    
    const byStatus: Record<string, number> = {};
    for (const row of statusResult.rows) {
      byStatus[(row.status as string) || 'unknown'] = parseInt(row.count as string);
    }
    
    const byCluster: Record<string, number> = {};
    for (const row of clusterResult.rows) {
      if (row.cluster) {
        byCluster[row.cluster as string] = parseInt(row.count as string);
      }
    }
    
    return {
      totalShells: parseInt((totalResult.rows[0]?.count as string) || '0'),
      byEngine,
      byStatus,
      byCluster,
    };
  } catch (error) {
    console.error("Error getting expansion stats:", error);
    return {
      totalShells: 0,
      byEngine: {},
      byStatus: {},
      byCluster: {},
    };
  }
}

export function getGeneratedShell(slug: string): GeneratedShell | null {
  return null;
}

export function getAllGeneratedShells(): GeneratedShell[] {
  return [];
}

export async function previewExpansion(blueprintId: string): Promise<{
  blueprint: EngineBlueprint | null;
  wouldCreate: string[];
  wouldSkip: string[];
  totalPotential: number;
}> {
  const blueprint = getBlueprint(blueprintId);
  
  if (!blueprint) {
    return {
      blueprint: null,
      wouldCreate: [],
      wouldSkip: [],
      totalPotential: 0,
    };
  }
  
  const shells = generateAllShells(blueprint);
  const slugs = shells.map(s => s.slug);
  
  if (slugs.length === 0) {
    return {
      blueprint,
      wouldCreate: [],
      wouldSkip: [],
      totalPotential: 0,
    };
  }
  
  try {
    const existingResult = await query(
      `SELECT slug FROM tools WHERE slug = ANY($1)`,
      [slugs]
    );
    const existingSlugs = new Set(existingResult.rows.map(r => r.slug));
    
    const wouldCreate: string[] = [];
    const wouldSkip: string[] = [];
    
    for (const shell of shells) {
      if (existingSlugs.has(shell.slug)) {
        wouldSkip.push(shell.slug);
      } else {
        wouldCreate.push(shell.slug);
      }
    }
    
    return {
      blueprint,
      wouldCreate,
      wouldSkip,
      totalPotential: shells.length,
    };
  } catch (error) {
    console.error("Error previewing expansion:", error);
    return {
      blueprint,
      wouldCreate: slugs,
      wouldSkip: [],
      totalPotential: shells.length,
    };
  }
}
