import { Client } from "@replit/object-storage";
import { 
  BoundaryState, 
  ValidationReport, 
  ValidationCheck,
  CompilerManifest,
  Beat
} from "./types";
import { appendLog, getBeatPath, loadManifest, updateBeat, saveManifest } from "./manifest";
import { loadBoundaryState } from "./boundary";

const client = new Client();

export async function validateBeatBoundary(
  jobId: string,
  beatIndex: number,
  startState: BoundaryState,
  manifest: CompilerManifest
): Promise<ValidationReport> {
  const beat = manifest.beats[beatIndex];
  const checks: ValidationCheck[] = [];
  
  if (beatIndex === 0) {
    checks.push({
      name: "first_beat",
      passed: true,
      message: "First beat - no prior boundary to validate",
    });
    
    return {
      passed: true,
      checks,
      timestamp: new Date().toISOString(),
    };
  }
  
  const prevBeat = manifest.beats[beatIndex - 1];
  if (!prevBeat.boundary_end?.state) {
    checks.push({
      name: "prior_boundary_exists",
      passed: false,
      message: "Previous beat has no boundary end state",
    });
    
    return {
      passed: false,
      checks,
      timestamp: new Date().toISOString(),
    };
  }
  
  const prevEndState = prevBeat.boundary_end.state;
  
  checks.push(validateCameraAngle(prevEndState, startState));
  checks.push(validateFacingDirection(prevEndState, startState));
  checks.push(validateScreenPosition(prevEndState, startState));
  checks.push(validateLightingDirection(prevEndState, startState));
  checks.push(validateSceneId(prevEndState, startState, manifest));
  checks.push(validateIdentityAnchors(prevEndState, startState, manifest));
  
  const passed = checks.every(c => c.passed);
  
  return {
    passed,
    checks,
    timestamp: new Date().toISOString(),
  };
}

function validateCameraAngle(prev: BoundaryState, current: BoundaryState): ValidationCheck {
  const compatible = areCameraAnglesCompatible(prev.camera_angle, current.camera_angle);
  return {
    name: "camera_angle",
    passed: compatible,
    expected: prev.camera_angle,
    actual: current.camera_angle,
    message: compatible ? "Camera angle transition acceptable" : "Camera angle mismatch",
  };
}

function validateFacingDirection(prev: BoundaryState, current: BoundaryState): ValidationCheck {
  const match = prev.facing_direction === current.facing_direction;
  return {
    name: "facing_direction",
    passed: match,
    expected: prev.facing_direction,
    actual: current.facing_direction,
    message: match ? "Facing direction matches" : "Facing direction changed",
  };
}

function validateScreenPosition(prev: BoundaryState, current: BoundaryState): ValidationCheck {
  const compatible = areScreenPositionsCompatible(prev.screen_position, current.screen_position);
  return {
    name: "screen_position",
    passed: compatible,
    expected: prev.screen_position,
    actual: current.screen_position,
    message: compatible ? "Screen position acceptable" : "Screen position mismatch",
  };
}

function validateLightingDirection(prev: BoundaryState, current: BoundaryState): ValidationCheck {
  const match = prev.lighting_direction === current.lighting_direction;
  return {
    name: "lighting_direction",
    passed: match,
    expected: prev.lighting_direction,
    actual: current.lighting_direction,
    message: match ? "Lighting direction consistent" : "Lighting direction changed",
  };
}

function validateSceneId(
  prev: BoundaryState, 
  current: BoundaryState,
  manifest: CompilerManifest
): ValidationCheck {
  const expectedSceneId = manifest.scene_pack?.id || prev.scene_id;
  const match = current.scene_id === expectedSceneId || current.scene_id === prev.scene_id;
  return {
    name: "scene_id",
    passed: match,
    expected: expectedSceneId,
    actual: current.scene_id,
    message: match ? "Scene ID matches" : "Scene ID changed unexpectedly",
  };
}

function validateIdentityAnchors(
  prev: BoundaryState,
  current: BoundaryState,
  manifest: CompilerManifest
): ValidationCheck {
  const passed = true;
  return {
    name: "identity_anchors",
    passed,
    message: "Identity anchors validated (V1 placeholder)",
  };
}

function areCameraAnglesCompatible(prev: string, current: string): boolean {
  const buckets: Record<string, string[]> = {
    "wide": ["wide", "medium"],
    "medium": ["wide", "medium", "close-up"],
    "close-up": ["medium", "close-up", "extreme-close-up"],
    "extreme-close-up": ["close-up", "extreme-close-up"],
  };
  
  const compatibleAngles = buckets[prev] || [prev];
  return compatibleAngles.includes(current);
}

function areScreenPositionsCompatible(prev: string, current: string): boolean {
  const adjacentPositions: Record<string, string[]> = {
    "center": ["center", "left-third", "right-third", "upper-third", "lower-third"],
    "left-third": ["center", "left-third", "upper-left", "lower-left"],
    "right-third": ["center", "right-third", "upper-right", "lower-right"],
    "upper-third": ["center", "upper-third", "upper-left", "upper-right"],
    "lower-third": ["center", "lower-third", "lower-left", "lower-right"],
  };
  
  const compatible = adjacentPositions[prev] || [prev];
  return compatible.includes(current);
}

export async function saveValidationReport(
  jobId: string,
  beatId: string,
  report: ValidationReport
): Promise<void> {
  const beatPath = getBeatPath(jobId, beatId);
  const reportPath = `${beatPath}/validate.report.json`;
  await client.uploadFromText(reportPath, JSON.stringify(report, null, 2));
}

export async function handleValidationResult(
  jobId: string,
  beatIndex: number,
  report: ValidationReport
): Promise<{ shouldContinue: boolean; halted: boolean }> {
  const manifest = await loadManifest(jobId);
  if (!manifest) return { shouldContinue: false, halted: true };
  
  const beat = manifest.beats[beatIndex];
  
  if (report.passed) {
    await updateBeat(jobId, beatIndex, {
      status: "PASS",
      validate_report: report,
    });
    await appendLog(jobId, "info", "validate", "Beat validation passed", {
      beatId: beat.id,
      checks: report.checks.length,
    });
    return { shouldContinue: true, halted: false };
  }
  
  beat.attempts += 1;
  
  if (beat.attempts >= beat.max_attempts) {
    await updateBeat(jobId, beatIndex, {
      status: "FAIL",
      attempts: beat.attempts,
      validate_report: report,
      error: "Max attempts exceeded",
    });
    
    manifest.status = "halted";
    manifest.error = `Beat ${beat.id} failed validation after ${beat.max_attempts} attempts`;
    await saveManifest(jobId, manifest);
    
    await appendLog(jobId, "error", "validate", "Beat validation failed - job halted", {
      beatId: beat.id,
      attempts: beat.attempts,
      failed_checks: report.checks.filter(c => !c.passed).map(c => c.name),
    });
    
    return { shouldContinue: false, halted: true };
  }
  
  await updateBeat(jobId, beatIndex, {
    status: "WAITING_UPLOAD",
    attempts: beat.attempts,
    validate_report: report,
  });
  
  await appendLog(jobId, "warn", "validate", "Beat validation failed - awaiting retry", {
    beatId: beat.id,
    attempts: beat.attempts,
    remaining: beat.max_attempts - beat.attempts,
    failed_checks: report.checks.filter(c => !c.passed).map(c => c.name),
  });
  
  return { shouldContinue: false, halted: false };
}
