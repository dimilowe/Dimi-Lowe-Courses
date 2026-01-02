import { 
  RenderPacket, 
  CompilerManifest, 
  Beat,
  BoundaryState
} from "./types";
import { RENDER_PACKET_VERSION, DEFAULT_HOLD_DURATION } from "./constants";
import { loadManifest } from "./manifest";
import { loadBoundaryState, getBoundaryFrameUrl } from "./boundary";

export async function generateRenderPacket(
  jobId: string,
  beatIndex?: number
): Promise<RenderPacket | null> {
  const manifest = await loadManifest(jobId);
  if (!manifest) return null;
  
  const targetIndex = beatIndex ?? manifest.current_beat_index;
  const beat = manifest.beats[targetIndex];
  if (!beat) return null;
  
  if (!manifest.character_pack || !manifest.scene_pack || !manifest.style_dna) {
    return null;
  }
  
  const motionTemplate = manifest.motion_skeleton?.beats[targetIndex];
  if (!motionTemplate) return null;
  
  let boundaryStart: RenderPacket["boundary_start"] = undefined;
  
  if (targetIndex > 0) {
    const prevBeat = manifest.beats[targetIndex - 1];
    
    if (prevBeat.boundary_end?.state) {
      const frameUrl = await getBoundaryFrameUrl(jobId, prevBeat.id, "end");
      
      boundaryStart = {
        required: true,
        frame_url: frameUrl || undefined,
        state: prevBeat.boundary_end.state,
        hold_duration: DEFAULT_HOLD_DURATION,
      };
    } else {
      boundaryStart = {
        required: true,
        state: {
          camera_angle: motionTemplate.camera_angle,
          facing_direction: "center",
          screen_position: "center",
          lighting_direction: manifest.scene_pack.lighting_direction || "front",
          identity_anchors: manifest.character_pack.identity_anchors,
          scene_id: manifest.scene_pack.id,
          timestamp: Date.now(),
        },
        hold_duration: DEFAULT_HOLD_DURATION,
      };
    }
  }
  
  const prevBeatState = targetIndex > 0 
    ? manifest.beats[targetIndex - 1].boundary_end?.state 
    : undefined;
  
  const packet: RenderPacket = {
    version: RENDER_PACKET_VERSION,
    beat_id: beat.id,
    beat_index: targetIndex,
    total_beats: manifest.beats.length,
    invariants: {
      character: manifest.character_pack,
      scene: manifest.scene_pack,
      style: manifest.style_dna,
    },
    boundary_start: boundaryStart,
    render_instructions: {
      camera_angle: motionTemplate.camera_angle,
      motion_type: motionTemplate.motion_type,
      duration_target: beat.duration_target,
      transition_in: motionTemplate.transition_in,
      transition_out: motionTemplate.transition_out,
    },
    continuity_requirements: {
      must_match_previous_boundary: targetIndex > 0,
      camera_angle_bucket: prevBeatState?.camera_angle || motionTemplate.camera_angle,
      facing_direction: prevBeatState?.facing_direction || "center",
      screen_position_bucket: prevBeatState?.screen_position || "center",
      lighting_direction: prevBeatState?.lighting_direction || manifest.scene_pack.lighting_direction || "front",
    },
  };
  
  return packet;
}

export function formatPacketForDisplay(packet: RenderPacket): string {
  return JSON.stringify(packet, null, 2);
}
