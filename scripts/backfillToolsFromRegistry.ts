import { toolsRegistry } from '@/data/toolsRegistry';
import { query } from '@/lib/db';

async function backfillToolsFromRegistry() {
  console.log(`Backfilling ${toolsRegistry.length} tools from registry to DB...`);
  
  let updated = 0;
  let notFound = 0;
  const notFoundSlugs: string[] = [];
  
  for (const tool of toolsRegistry) {
    const { slug, cloud_ids, required_tier } = tool;
    
    const result = await query(
      `UPDATE tools 
       SET required_clouds = $1::text[],
           required_tier = $2
       WHERE slug = $3`,
      [cloud_ids, required_tier, slug]
    );
    
    if (result.rowCount && result.rowCount > 0) {
      updated++;
      console.log(`  ✓ Updated: ${slug} → clouds=[${cloud_ids.join(',')}], tier=${required_tier}`);
    } else {
      notFound++;
      notFoundSlugs.push(slug);
    }
  }
  
  console.log('\n--- Summary ---');
  console.log(`Updated: ${updated}`);
  console.log(`Not found in DB: ${notFound}`);
  
  if (notFoundSlugs.length > 0) {
    console.log('\nRegistry slugs not found in DB:');
    notFoundSlugs.forEach(slug => console.log(`  - ${slug}`));
  }
  
  const orphanedTools = await query(
    `SELECT slug, required_tier, required_clouds
     FROM tools
     WHERE required_tier <> 'free'
       AND (required_clouds = '{}' OR array_length(required_clouds, 1) IS NULL)`
  );
  
  if (orphanedTools.rows.length > 0) {
    console.log('\n⚠️ DB tools with non-free tier but no clouds:');
    orphanedTools.rows.forEach((row: any) => {
      console.log(`  - ${row.slug} (tier=${row.required_tier})`);
    });
  }
  
  console.log('\nBackfill complete.');
  process.exit(0);
}

backfillToolsFromRegistry().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
