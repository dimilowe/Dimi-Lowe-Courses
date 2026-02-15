#!/usr/bin/env python3
"""
VCM Audio Effects Worker (Spotify Pedalboard)
Processes an uploaded audio file with a selected effect chain and writes WAV output.
"""

import argparse
import json
import os
import sys
import traceback
from typing import Any, Dict

import numpy as np
from pedalboard import (
    Bitcrush,
    Compressor,
    Delay,
    Gain,
    HighpassFilter,
    Limiter,
    LowpassFilter,
    Pedalboard,
    PitchShift,
    Reverb,
)
from pedalboard.io import AudioFile


def clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def to_float(settings: Dict[str, Any], key: str, default: float) -> float:
    try:
        return float(settings.get(key, default))
    except Exception:
        return default


def to_bool(settings: Dict[str, Any], key: str, default: bool) -> bool:
    v = settings.get(key, default)
    if isinstance(v, bool):
        return v
    if isinstance(v, str):
        return v.lower() in ("1", "true", "yes", "on")
    return bool(v)


def build_board(kind: str, s: Dict[str, Any]) -> Pedalboard:
    if kind == "pitch-shift":
        semitones = clamp(to_float(s, "semitones", 0), -24, 24)
        return Pedalboard([PitchShift(semitones=semitones)])

    if kind == "reverb":
        room_size = clamp(to_float(s, "roomSize", 0.35), 0.0, 1.0)
        damp = clamp(to_float(s, "damp", 0.4), 0.0, 1.0)
        wet = clamp(to_float(s, "mix", 0.5), 0.0, 1.0)
        return Pedalboard([Reverb(room_size=room_size, damping=damp, wet_level=wet, dry_level=1.0 - wet)])

    if kind == "delay":
        delay_seconds = clamp(to_float(s, "delayMs", 220) / 1000.0, 0.001, 2.0)
        feedback = clamp(to_float(s, "feedback", 0.25), 0.0, 0.98)
        wet = clamp(to_float(s, "mix", 0.35), 0.0, 1.0)
        return Pedalboard([Delay(delay_seconds=delay_seconds, feedback=feedback, mix=wet)])

    if kind == "compressor":
        threshold = clamp(to_float(s, "threshold", -24), -80, 0)
        ratio = clamp(to_float(s, "ratio", 4), 1, 20)
        attack = clamp(to_float(s, "attack", 0.01), 0.0001, 1)
        release = clamp(to_float(s, "release", 0.25), 0.001, 3)
        return Pedalboard([Compressor(threshold_db=threshold, ratio=ratio, attack_ms=attack * 1000, release_ms=release * 1000)])

    if kind == "limiter":
        threshold = clamp(to_float(s, "threshold", -6), -30, 0)
        release = clamp(to_float(s, "release", 0.08), 0.001, 2)
        return Pedalboard([Limiter(threshold_db=threshold, release_ms=release * 1000)])

    if kind == "high-pass":
        freq = clamp(to_float(s, "frequency", 120), 20, 20000)
        return Pedalboard([HighpassFilter(cutoff_frequency_hz=freq)])

    if kind == "low-pass":
        freq = clamp(to_float(s, "frequency", 5000), 20, 20000)
        return Pedalboard([LowpassFilter(cutoff_frequency_hz=freq)])

    if kind == "bitcrusher":
        bits = int(clamp(to_float(s, "bits", 8), 1, 16))
        return Pedalboard([Bitcrush(bit_depth=bits)])

    chain = []
    if to_bool(s, "chainCompressorOn", True):
        threshold = clamp(to_float(s, "threshold", -20), -80, 0)
        ratio = clamp(to_float(s, "ratio", 3), 1, 20)
        attack = clamp(to_float(s, "attack", 0.01), 0.0001, 1)
        release = clamp(to_float(s, "release", 0.25), 0.001, 3)
        chain.append(
            Compressor(
                threshold_db=threshold,
                ratio=ratio,
                attack_ms=attack * 1000,
                release_ms=release * 1000,
            )
        )

    if to_bool(s, "chainEqOn", True):
        freq = clamp(to_float(s, "frequency", 120), 20, 20000)
        chain.append(HighpassFilter(cutoff_frequency_hz=freq))

    if to_bool(s, "chainReverbOn", False):
        room_size = clamp(to_float(s, "roomSize", 0.35), 0.0, 1.0)
        damp = clamp(to_float(s, "damp", 0.4), 0.0, 1.0)
        wet = clamp(to_float(s, "mix", 0.3), 0.0, 1.0)
        chain.append(Reverb(room_size=room_size, damping=damp, wet_level=wet, dry_level=1.0 - wet))

    if to_bool(s, "chainDelayOn", False):
        delay_seconds = clamp(to_float(s, "delayMs", 220) / 1000.0, 0.001, 2.0)
        feedback = clamp(to_float(s, "feedback", 0.25), 0.0, 0.98)
        wet = clamp(to_float(s, "mix", 0.2), 0.0, 1.0)
        chain.append(Delay(delay_seconds=delay_seconds, feedback=feedback, mix=wet))

    if len(chain) == 0:
        chain = [Gain(gain_db=0)]
    return Pedalboard(chain)


def ensure_2d(audio: np.ndarray) -> np.ndarray:
    if audio.ndim == 1:
        return np.expand_dims(audio, axis=0)
    return audio


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--kind", required=True)
    parser.add_argument("--settings", required=False, default="{}")
    args = parser.parse_args()

    try:
        settings = json.loads(args.settings or "{}")
        board = build_board(args.kind, settings)

        with AudioFile(args.input, "r") as f:
            sample_rate = f.samplerate
            num_channels = f.num_channels
            audio = f.read(f.frames)

        audio = ensure_2d(audio)
        dry = np.copy(audio)
        wet = board(audio, sample_rate, reset=True)
        wet = ensure_2d(wet)

        if wet.shape[1] != dry.shape[1]:
            if wet.shape[1] < dry.shape[1]:
                pad = dry.shape[1] - wet.shape[1]
                wet = np.pad(wet, ((0, 0), (0, pad)))
            else:
                wet = wet[:, : dry.shape[1]]

        bypass = to_bool(settings, "bypass", False)
        mix = clamp(to_float(settings, "mix", 0.5), 0.0, 1.0)
        gain = clamp(to_float(settings, "outputGain", 1.0), 0.0, 4.0)

        if bypass:
            out = dry
        else:
            out = (dry * (1.0 - mix)) + (wet * mix)

        if gain != 1.0:
            gain_db = 20.0 * np.log10(max(gain, 1e-6))
            out = Gain(gain_db=gain_db)(out, sample_rate)

        out = np.clip(out, -1.0, 1.0).astype(np.float32)

        out_dir = os.path.dirname(args.output)
        if out_dir:
            os.makedirs(out_dir, exist_ok=True)

        with AudioFile(args.output, "w", sample_rate, num_channels) as outf:
            outf.write(out)

        print(json.dumps({"ok": True, "output": args.output}))
        return 0

    except Exception as e:
        err = {"ok": False, "error": str(e), "trace": traceback.format_exc(limit=3)}
        print(json.dumps(err), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
