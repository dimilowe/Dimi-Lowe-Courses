#!/usr/bin/env tsx
import { execSync } from 'child_process';

const CANONICAL_FILE = 'lib/entitlements/tiers.ts';

const patterns = [
  'const TIER_ORDER',
  'ENTITLEMENT_TIERS\\s*=\\s*\\[',
];

let hasError = false;

for (const pattern of patterns) {
  try {
    const result = execSync(
      `grep -rn --include="*.ts" --include="*.tsx" "${pattern}" . --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=dist 2>/dev/null || true`,
      { encoding: 'utf8' }
    );
    
    const lines = result.trim().split('\n').filter(Boolean);
    
    for (const line of lines) {
      if (!line.includes(CANONICAL_FILE) && !line.includes('// canonical') && !line.includes('check-tier-duplicates')) {
        console.error(`ERROR: Duplicate tier constant found: ${line}`);
        hasError = true;
      }
    }
  } catch (e) {
  }
}

if (hasError) {
  console.error('\nTier constants must only be defined in lib/entitlements/tiers.ts');
  console.error('Import from there instead of creating new definitions.');
  process.exit(1);
} else {
  console.log('No duplicate tier constants found.');
  process.exit(0);
}
