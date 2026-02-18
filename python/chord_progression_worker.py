#!/usr/bin/env python3
"""
VCM Chord Progression Finder Worker
Derives chord labels from detected note events using template matching.
"""

import argparse
import csv
import json
import math
import os
import sys
import traceback
from collections import defaultdict

import numpy as np
import soundfile as sf
from basic_pitch.inference import predict
from basic_pitch import ICASSP_2022_MODEL_PATH
import mido

NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

CHORD_TEMPLATES = {
    'maj': [0, 4, 7],
    'min': [0, 3, 7],
    'dim': [0, 3, 6],
    'aug': [0, 4, 8],
    'maj7': [0, 4, 7, 11],
    'min7': [0, 3, 7, 10],
    'dom7': [0, 4, 7, 10],
    'm7b5': [0, 3, 6, 10],
    'sus2': [0, 2, 7],
    'sus4': [0, 5, 7],
    'add9': [0, 2, 4, 7],
    'maj6': [0, 4, 7, 9],
    'min6': [0, 3, 7, 9],
}

CHORD_DISPLAY = {
    'maj': '',
    'min': 'm',
    'dim': 'dim',
    'aug': 'aug',
    'maj7': 'maj7',
    'min7': 'm7',
    'dom7': '7',
    'm7b5': 'm7b5',
    'sus2': 'sus2',
    'sus4': 'sus4',
    'add9': 'add9',
    'maj6': '6',
    'min6': 'm6',
}


def sigmoid(x):
    return 1 / (1 + math.exp(-x))


def midi_to_pitch_class(midi_pitch):
    return midi_pitch % 12


def get_active_notes_in_window(notes, win_start, win_end, min_overlap=0.2):
    """Get notes that overlap with the window by at least min_overlap seconds."""
    active = []
    for note in notes:
        start = note['start_time']
        end = note['end_time']
        overlap_start = max(start, win_start)
        overlap_end = min(end, win_end)
        overlap = overlap_end - overlap_start
        if overlap >= min_overlap:
            active.append({
                **note,
                'overlap': overlap
            })
    return active


def build_pitch_class_vector(active_notes):
    """Build a 12-bin pitch class vector weighted by overlap duration."""
    pc = np.zeros(12)
    for note in active_notes:
        pitch_class = midi_to_pitch_class(note['pitch'])
        weight = note['overlap'] * (note.get('velocity', 80) / 127.0)
        pc[pitch_class] += weight
    return pc


def score_chord(pc_vector, root, template):
    """Score how well a pitch class vector matches a chord template at given root."""
    total = pc_vector.sum() + 1e-9
    
    chord_tones = set((root + t) % 12 for t in template)
    non_chord_tones = set(range(12)) - chord_tones
    
    template_present = sum(pc_vector[t] for t in chord_tones)
    non_chord_present = sum(pc_vector[t] for t in non_chord_tones)
    
    score = (template_present / total) - 0.35 * (non_chord_present / total)
    return max(0.0, min(1.0, score))


def find_best_chord(pc_vector):
    """Find the best matching chord for a pitch class vector."""
    if pc_vector.sum() < 0.01:
        return None, 0.0, []
    
    all_scores = []
    
    for root in range(12):
        for quality, template in CHORD_TEMPLATES.items():
            score = score_chord(pc_vector, root, template)
            root_name = NOTE_NAMES[root]
            chord_label = f"{root_name}{CHORD_DISPLAY[quality]}"
            chord_tones = [(root + t) % 12 for t in template]
            note_names = [NOTE_NAMES[t] for t in chord_tones]
            all_scores.append({
                'root': root_name,
                'quality': quality,
                'label': chord_label,
                'score': score,
                'notes': note_names
            })
    
    all_scores.sort(key=lambda x: x['score'], reverse=True)
    
    if len(all_scores) >= 2:
        best = all_scores[0]
        second = all_scores[1]
        confidence = sigmoid((best['score'] - second['score']) * 8)
        
        if pc_vector.sum() < 0.5:
            confidence *= 0.5
    else:
        confidence = 0.0
    
    best = all_scores[0]
    return best, confidence, all_scores[:5]


def analyze_chord_progression(notes, duration, window_sec=2.0, hop_sec=1.0):
    """Analyze notes and return chord segments."""
    windows = []
    pos = 0.0
    
    while pos < duration:
        win_end = min(pos + window_sec, duration)
        active = get_active_notes_in_window(notes, pos, win_end)
        pc_vector = build_pitch_class_vector(active)
        best_chord, confidence, candidates = find_best_chord(pc_vector)
        
        if best_chord:
            windows.append({
                'startSec': round(pos, 2),
                'endSec': round(win_end, 2),
                'chordLabel': best_chord['label'],
                'root': best_chord['root'],
                'quality': best_chord['quality'],
                'confidence': round(confidence, 3),
                'notes': best_chord['notes'],
                'candidates': [{'chordLabel': c['label'], 'confidence': round(c['score'], 3)} for c in candidates]
            })
        else:
            windows.append({
                'startSec': round(pos, 2),
                'endSec': round(win_end, 2),
                'chordLabel': 'N.C.',
                'root': '',
                'quality': '',
                'confidence': 0.0,
                'notes': [],
                'candidates': []
            })
        
        pos += hop_sec
    
    merged = merge_chord_segments(windows)
    return merged


def merge_chord_segments(windows):
    """Merge consecutive windows with same chord, apply hysteresis."""
    if not windows:
        return []
    
    merged = []
    current = windows[0].copy()
    
    for i in range(1, len(windows)):
        w = windows[i]
        
        if w['chordLabel'] == current['chordLabel'] and w['confidence'] >= 0.45:
            current['endSec'] = w['endSec']
            current['confidence'] = max(current['confidence'], w['confidence'])
        elif i + 1 < len(windows) and windows[i + 1]['chordLabel'] == current['chordLabel']:
            current['endSec'] = windows[i + 1]['endSec']
        else:
            merged.append(current)
            current = w.copy()
    
    merged.append(current)
    
    final = []
    for seg in merged:
        seg_duration = seg['endSec'] - seg['startSec']
        if seg_duration >= 1.5 or seg['confidence'] >= 0.7:
            final.append(seg)
        elif final:
            final[-1]['endSec'] = seg['endSec']
    
    return final


def write_chord_csv(chords, output_path):
    """Write chord timeline to CSV."""
    with open(output_path, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['start_sec', 'end_sec', 'chord', 'root', 'quality', 'confidence', 'notes'])
        for chord in chords:
            writer.writerow([
                chord['startSec'],
                chord['endSec'],
                chord['chordLabel'],
                chord['root'],
                chord['quality'],
                chord['confidence'],
                ','.join(chord['notes'])
            ])


def write_chord_midi(chords, output_path, ticks_per_beat=480, tempo_bpm=120):
    """Write chord track as MIDI file with block chords."""
    mid = mido.MidiFile(ticks_per_beat=ticks_per_beat)
    track = mido.MidiTrack()
    mid.tracks.append(track)
    
    tempo = mido.bpm2tempo(tempo_bpm)
    track.append(mido.MetaMessage('set_tempo', tempo=tempo, time=0))
    track.append(mido.MetaMessage('track_name', name='Chord Track', time=0))
    
    def sec_to_ticks(sec):
        return int(sec * ticks_per_beat * tempo_bpm / 60)
    
    current_tick = 0
    
    for chord in chords:
        if chord['chordLabel'] == 'N.C.' or not chord['notes']:
            continue
        
        start_tick = sec_to_ticks(chord['startSec'])
        end_tick = sec_to_ticks(chord['endSec'])
        duration_ticks = end_tick - start_tick
        
        delta = start_tick - current_tick
        
        root_idx = NOTE_NAMES.index(chord['root']) if chord['root'] in NOTE_NAMES else 0
        base_midi = 48 + root_idx
        
        template = CHORD_TEMPLATES.get(chord['quality'], [0, 4, 7])
        midi_notes = [(base_midi + t) for t in template]
        
        for i, note in enumerate(midi_notes):
            track.append(mido.Message('note_on', note=note, velocity=80, time=delta if i == 0 else 0))
        
        for i, note in enumerate(midi_notes):
            track.append(mido.Message('note_off', note=note, velocity=0, time=duration_ticks if i == 0 else 0))
        
        current_tick = end_tick
    
    mid.save(output_path)


def main():
    parser = argparse.ArgumentParser(description='Find chord progression from audio')
    parser.add_argument('--input', required=True, help='Path to input WAV file')
    parser.add_argument('--out', required=True, help='Output directory')
    args = parser.parse_args()
    
    try:
        os.makedirs(args.out, exist_ok=True)
        
        audio_data, sr = sf.read(args.input)
        if len(audio_data.shape) > 1:
            audio_data = audio_data.mean(axis=1)
        duration = len(audio_data) / sr
        
        model_output, midi_data, note_events = predict(args.input)
        
        notes = []
        for note in note_events:
            notes.append({
                'start_time': float(note[0]),
                'end_time': float(note[1]),
                'pitch': int(note[2]),
                'velocity': float(note[3]) if len(note) > 3 else 80,
                'amplitude': float(note[4]) if len(note) > 4 else 0.5
            })
        
        chords = analyze_chord_progression(notes, duration)
        
        alt_candidates = []
        for chord in chords:
            if chord.get('candidates'):
                alt_candidates.append({
                    'startSec': chord['startSec'],
                    'endSec': chord['endSec'],
                    'candidates': chord['candidates']
                })
        
        result = {
            'chords': [{
                'startSec': c['startSec'],
                'endSec': c['endSec'],
                'chordLabel': c['chordLabel'],
                'root': c['root'],
                'quality': c['quality'],
                'confidence': c['confidence'],
                'notes': c['notes']
            } for c in chords],
            'altCandidates': alt_candidates,
            'duration': round(duration, 2)
        }
        
        json_path = os.path.join(args.out, 'chord_timeline.json')
        with open(json_path, 'w') as f:
            json.dump(result, f, indent=2)
        
        csv_path = os.path.join(args.out, 'chord_timeline.csv')
        write_chord_csv(chords, csv_path)
        
        midi_path = os.path.join(args.out, 'chord_track.mid')
        write_chord_midi(chords, midi_path)
        
        result['files'] = {
            'json': 'chord_timeline.json',
            'csv': 'chord_timeline.csv',
            'midi': 'chord_track.mid'
        }
        
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {
            'error': str(e),
            'traceback': traceback.format_exc()
        }
        print(json.dumps(error_result), file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
