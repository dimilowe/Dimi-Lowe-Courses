#!/usr/bin/env python3
"""
Audio to MIDI worker.
Converts audio files to MIDI with pitch bend support.
"""

import argparse
import json
import os
import sys
import tempfile
from pathlib import Path

import numpy as np
import soundfile as sf
from basic_pitch.inference import predict_and_save, predict
from basic_pitch import ICASSP_2022_MODEL_PATH


def sonify_midi_to_wav(notes, output_path: str, duration: float, sample_rate: int = 22050):
    """
    Create a simple sonification of the detected notes as a WAV file.
    Uses sine waves for each note with pitch.
    """
    samples = int(duration * sample_rate)
    audio = np.zeros(samples, dtype=np.float32)
    
    for start_time, end_time, pitch, amplitude, _ in notes:
        freq = 440.0 * (2.0 ** ((pitch - 69) / 12.0))
        start_sample = int(start_time * sample_rate)
        end_sample = min(int(end_time * sample_rate), samples)
        
        if start_sample >= samples or end_sample <= start_sample:
            continue
        
        t = np.arange(end_sample - start_sample) / sample_rate
        
        attack = min(0.01, (end_time - start_time) * 0.1)
        release = min(0.05, (end_time - start_time) * 0.2)
        
        envelope = np.ones(len(t))
        attack_samples = int(attack * sample_rate)
        release_samples = int(release * sample_rate)
        
        if attack_samples > 0 and attack_samples < len(envelope):
            envelope[:attack_samples] = np.linspace(0, 1, attack_samples)
        if release_samples > 0 and release_samples < len(envelope):
            envelope[-release_samples:] = np.linspace(1, 0, release_samples)
        
        wave = amplitude * 0.3 * np.sin(2 * np.pi * freq * t) * envelope
        
        audio[start_sample:end_sample] += wave[:end_sample - start_sample]
    
    max_val = np.max(np.abs(audio))
    if max_val > 0:
        audio = audio / max_val * 0.8
    
    sf.write(output_path, audio, sample_rate)


def notes_to_csv(notes, output_path: str):
    """
    Export notes to CSV format.
    Columns: start_time, end_time, pitch, velocity, pitch_bend
    """
    with open(output_path, 'w') as f:
        f.write("start_time,end_time,pitch,velocity,pitch_bend\n")
        for start_time, end_time, pitch, amplitude, pitch_bends in notes:
            velocity = int(min(127, max(1, amplitude * 127)))
            bend_str = ""
            if pitch_bends is not None and len(pitch_bends) > 0:
                bend_str = ";".join([f"{b:.4f}" for b in pitch_bends[:10]])
            f.write(f"{start_time:.4f},{end_time:.4f},{pitch},{velocity},{bend_str}\n")


def main():
    parser = argparse.ArgumentParser(description='Convert audio to MIDI')
    parser.add_argument('--input', required=True, help='Path to input WAV file')
    parser.add_argument('--out', required=True, help='Output directory')
    args = parser.parse_args()
    
    input_path = Path(args.input)
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    
    if not input_path.exists():
        print(json.dumps({"error": f"Input file not found: {input_path}"}))
        sys.exit(1)
    
    try:
        info = sf.info(str(input_path))
        duration = info.duration
        sample_rate = info.samplerate
    except Exception as e:
        print(json.dumps({"error": f"Failed to read audio info: {str(e)}"}))
        sys.exit(1)
    
    try:
        model_output, midi_data, note_events = predict(
            str(input_path),
            model_or_model_path=ICASSP_2022_MODEL_PATH,
        )
        
        base_name = input_path.stem
        midi_path = out_dir / f"{base_name}.mid"
        csv_path = out_dir / f"{base_name}_notes.csv"
        wav_path = out_dir / f"{base_name}_sonified.wav"
        
        midi_data.write(str(midi_path))
        
        notes_to_csv(note_events, str(csv_path))
        
        sonify_midi_to_wav(note_events, str(wav_path), duration, sample_rate=22050)
        
        result = {
            "success": True,
            "midi_file": str(midi_path),
            "csv_file": str(csv_path),
            "wav_file": str(wav_path),
            "duration": duration,
            "sample_rate": sample_rate,
            "notes_count": len(note_events)
        }
        
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({"error": f"Transcription failed: {str(e)}"}))
        sys.exit(1)


if __name__ == "__main__":
    main()
