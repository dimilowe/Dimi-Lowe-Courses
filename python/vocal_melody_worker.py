#!/usr/bin/env python3
"""
VCM Vocal Melody Extractor Worker
Extracts a clean monophonic vocal melody from audio using Basic Pitch + post-processing.
"""

import warnings
warnings.filterwarnings("ignore")
import logging
logging.disable(logging.WARNING)

import argparse
import json
import os
import sys
import traceback

import numpy as np
import soundfile as sf
from basic_pitch.inference import predict
from basic_pitch import ICASSP_2022_MODEL_PATH


def hz_to_midi(hz):
    """Convert frequency in Hz to MIDI note number."""
    if hz <= 0:
        return 0
    return 69 + 12 * np.log2(hz / 440.0)


def midi_to_hz(midi_note):
    """Convert MIDI note number to frequency in Hz."""
    return 440.0 * (2.0 ** ((midi_note - 69) / 12.0))


def extract_monophonic_melody(note_events, frame_duration=0.02, vocal_range=(80, 1100)):
    """
    Extract a clean monophonic melody line from polyphonic note events.
    
    Args:
        note_events: List of (start_time, end_time, pitch_midi, amplitude, pitch_bend)
        frame_duration: Time resolution in seconds (20ms default)
        vocal_range: (min_hz, max_hz) preferred vocal frequency range
    
    Returns:
        melody_notes: List of (start_time, end_time, midi_note, frequency_hz, confidence)
        pitch_curve: List of (time_s, frequency_hz, midi_note_float, confidence)
    """
    if len(note_events) == 0:
        return [], []
    
    max_time = max(end for _, end, _, _, _ in note_events)
    num_frames = int(np.ceil(max_time / frame_duration)) + 1
    
    frame_pitch = np.zeros(num_frames)
    frame_confidence = np.zeros(num_frames)
    prev_pitch = 0
    
    min_hz, max_hz = vocal_range
    min_midi = hz_to_midi(min_hz)
    max_midi = hz_to_midi(max_hz)
    
    filtered_notes = []
    for start, end, pitch, amp, bend in note_events:
        duration = end - start
        if duration < 0.06:
            continue
        if amp < 0.1:
            continue
        filtered_notes.append((start, end, pitch, amp, bend))
    
    for frame_idx in range(num_frames):
        frame_time = frame_idx * frame_duration
        
        candidates = []
        for start, end, pitch, amp, bend in filtered_notes:
            if start <= frame_time < end:
                candidates.append((pitch, amp, end - start))
        
        if not candidates:
            continue
        
        best_score = -999
        best_pitch = 0
        best_conf = 0
        
        for pitch, amp, duration in candidates:
            score = amp
            
            if prev_pitch > 0:
                jump = abs(pitch - prev_pitch)
                score -= jump * 0.15
            
            if duration < 0.12:
                score -= 0.25
            
            if pitch < min_midi or pitch > max_midi:
                score -= 0.25
            
            if score > best_score:
                best_score = score
                best_pitch = pitch
                best_conf = amp
        
        if frame_pitch[frame_idx - 1] == best_pitch if frame_idx > 0 else False:
            pass
        elif frame_idx > 0 and frame_pitch[frame_idx - 1] > 0:
            current_active = frame_pitch[frame_idx - 1]
            for pitch, amp, duration in candidates:
                if pitch == current_active:
                    current_score = amp
                    if prev_pitch > 0:
                        current_score -= abs(pitch - prev_pitch) * 0.15
                    if duration < 0.12:
                        current_score -= 0.25
                    if pitch < min_midi or pitch > max_midi:
                        current_score -= 0.25
                    
                    if best_score - current_score < 0.10:
                        best_pitch = current_active
                        best_conf = frame_confidence[frame_idx - 1]
                    break
        
        frame_pitch[frame_idx] = best_pitch
        frame_confidence[frame_idx] = best_conf
        if best_pitch > 0:
            prev_pitch = best_pitch
    
    pitch_curve = []
    for frame_idx in range(num_frames):
        time_s = frame_idx * frame_duration
        midi_note = frame_pitch[frame_idx]
        conf = frame_confidence[frame_idx]
        if midi_note > 0:
            freq_hz = midi_to_hz(midi_note)
        else:
            freq_hz = 0
        pitch_curve.append((time_s, freq_hz, midi_note, conf))
    
    melody_notes = []
    current_note = None
    current_start = 0
    current_conf_sum = 0
    current_count = 0
    
    for frame_idx in range(num_frames):
        time_s = frame_idx * frame_duration
        pitch = frame_pitch[frame_idx]
        conf = frame_confidence[frame_idx]
        
        if pitch > 0:
            pitch_int = int(round(pitch))
            if current_note is None:
                current_note = pitch_int
                current_start = time_s
                current_conf_sum = conf
                current_count = 1
            elif pitch_int == current_note:
                current_conf_sum += conf
                current_count += 1
            else:
                end_time = time_s
                if end_time - current_start >= 0.08:
                    avg_conf = current_conf_sum / current_count if current_count > 0 else 0
                    melody_notes.append((
                        current_start,
                        end_time,
                        current_note,
                        midi_to_hz(current_note),
                        avg_conf
                    ))
                current_note = pitch_int
                current_start = time_s
                current_conf_sum = conf
                current_count = 1
        else:
            if current_note is not None:
                end_time = time_s
                if end_time - current_start >= 0.08:
                    avg_conf = current_conf_sum / current_count if current_count > 0 else 0
                    melody_notes.append((
                        current_start,
                        end_time,
                        current_note,
                        midi_to_hz(current_note),
                        avg_conf
                    ))
                current_note = None
                current_conf_sum = 0
                current_count = 0
    
    if current_note is not None:
        end_time = num_frames * frame_duration
        if end_time - current_start >= 0.08:
            avg_conf = current_conf_sum / current_count if current_count > 0 else 0
            melody_notes.append((
                current_start,
                end_time,
                current_note,
                midi_to_hz(current_note),
                avg_conf
            ))
    
    merged_notes = []
    for note in melody_notes:
        if not merged_notes:
            merged_notes.append(note)
            continue
        
        prev = merged_notes[-1]
        gap = note[0] - prev[1]
        if gap < 0.06 and note[2] == prev[2]:
            merged_notes[-1] = (
                prev[0],
                note[1],
                prev[2],
                prev[3],
                (prev[4] + note[4]) / 2
            )
        else:
            merged_notes.append(note)
    
    final_notes = [n for n in merged_notes if n[1] - n[0] >= 0.08]
    
    return final_notes, pitch_curve


def write_melody_midi(notes, output_path, tempo=120):
    """Write monophonic melody notes to a MIDI file."""
    from midiutil import MIDIFile
    
    midi = MIDIFile(1)
    midi.addTempo(0, 0, tempo)
    midi.addProgramChange(0, 0, 0, 0)
    
    for start, end, pitch, freq, conf in notes:
        duration = end - start
        velocity = min(127, max(40, int(conf * 127)))
        beat_start = start * (tempo / 60.0)
        beat_duration = duration * (tempo / 60.0)
        midi.addNote(0, 0, pitch, beat_start, beat_duration, velocity)
    
    with open(output_path, 'wb') as f:
        midi.writeFile(f)


def write_notes_csv(notes, output_path):
    """Write melody notes to CSV."""
    with open(output_path, 'w') as f:
        f.write("start_time_s,end_time_s,midi_note,frequency_hz,confidence\n")
        for start, end, pitch, freq, conf in notes:
            f.write(f"{start:.4f},{end:.4f},{pitch},{freq:.2f},{conf:.4f}\n")


def write_pitch_curve_csv(pitch_curve, output_path):
    """Write pitch curve to CSV."""
    with open(output_path, 'w') as f:
        f.write("time_s,frequency_hz,midi_note_float,confidence\n")
        for time_s, freq, midi_note, conf in pitch_curve:
            f.write(f"{time_s:.4f},{freq:.2f},{midi_note:.2f},{conf:.4f}\n")


def sonify_melody_to_wav(notes, output_path, duration, sample_rate=22050):
    """Create a simple sine wave sonification of the melody."""
    samples = int(duration * sample_rate)
    audio = np.zeros(samples, dtype=np.float32)
    
    for start, end, pitch, freq, conf in notes:
        start_sample = int(start * sample_rate)
        end_sample = min(int(end * sample_rate), samples)
        
        if start_sample >= samples or end_sample <= start_sample:
            continue
        
        t = np.arange(end_sample - start_sample) / sample_rate
        envelope_len = len(t)
        
        attack = int(0.01 * sample_rate)
        release = int(0.02 * sample_rate)
        envelope = np.ones(envelope_len, dtype=np.float32)
        
        if attack < envelope_len:
            envelope[:attack] = np.linspace(0, 1, attack)
        if release < envelope_len:
            envelope[-release:] = np.linspace(1, 0, release)
        
        amplitude = 0.4 * min(1.0, conf + 0.3)
        wave = amplitude * envelope * np.sin(2 * np.pi * freq * t)
        
        audio[start_sample:end_sample] += wave.astype(np.float32)
    
    audio = np.clip(audio, -0.95, 0.95)
    sf.write(output_path, audio, sample_rate)


def main():
    parser = argparse.ArgumentParser(description='Extract vocal melody from audio using Basic Pitch')
    parser.add_argument('--input', required=True, help='Path to input WAV file')
    parser.add_argument('--out', required=True, help='Output directory')
    args = parser.parse_args()
    
    try:
        os.makedirs(args.out, exist_ok=True)
        
        old_stdout = sys.stdout
        sys.stdout = open(os.devnull, 'w')
        try:
            model_output, midi_data, note_events = predict(args.input)
        finally:
            sys.stdout.close()
            sys.stdout = old_stdout
        
        notes_list = []
        for start, end, pitch, amplitude, pitch_bend in note_events:
            notes_list.append((
                float(start),
                float(end),
                float(pitch),
                float(amplitude) if amplitude is not None else 1.0,
                pitch_bend
            ))
        
        melody_notes, pitch_curve = extract_monophonic_melody(notes_list)
        
        audio_data, sr = sf.read(args.input)
        audio_duration = len(audio_data) / sr
        
        midi_path = os.path.join(args.out, 'melody.mid')
        notes_path = os.path.join(args.out, 'melody_notes.csv')
        pitch_path = os.path.join(args.out, 'pitch_curve.csv')
        wav_path = os.path.join(args.out, 'melody_preview.wav')
        
        write_melody_midi(melody_notes, midi_path)
        write_notes_csv(melody_notes, notes_path)
        write_pitch_curve_csv(pitch_curve, pitch_path)
        sonify_melody_to_wav(melody_notes, wav_path, audio_duration)
        
        result = {
            "midi": "melody.mid",
            "notes": "melody_notes.csv",
            "pitch": "pitch_curve.csv",
            "wav": "melody_preview.wav",
            "note_count": len(melody_notes),
            "duration": audio_duration
        }
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {
            "error": str(e),
            "traceback": traceback.format_exc()
        }
        print(json.dumps(error_result), file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
