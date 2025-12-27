#!/usr/bin/env python3
"""
VCM Audio Key + Scale Detector Worker
Detects key, scale, confidence, and modulations using librosa chroma features.
"""

import argparse
import json
import os
import sys
import traceback

import numpy as np
import librosa

MAJOR_PROFILE = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
MINOR_PROFILE = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])

NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']


def cosine_similarity(a, b):
    """Compute cosine similarity between two vectors."""
    dot = np.dot(a, b)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def detect_key_from_chroma(chroma_vector, return_all=False):
    """
    Detect key from a 12-bin chroma vector using Krumhansl-Schmuckler profiles.
    
    Returns:
        (key_name, scale, key_label, confidence, all_scores)
    """
    scores = []
    
    for i in range(12):
        major_rotated = np.roll(MAJOR_PROFILE, i)
        minor_rotated = np.roll(MINOR_PROFILE, i)
        
        major_score = cosine_similarity(chroma_vector, major_rotated)
        minor_score = cosine_similarity(chroma_vector, minor_rotated)
        
        key_name = NOTE_NAMES[i]
        scores.append((key_name, 'major', f'{key_name} major', major_score))
        scores.append((key_name, 'minor', f'{key_name} minor', minor_score))
    
    scores.sort(key=lambda x: x[3], reverse=True)
    
    best = scores[0]
    second_best = scores[1]
    
    max_score = best[3]
    min_score = scores[-1][3]
    score_range = max_score - min_score
    
    if score_range > 0:
        confidence = (best[3] - second_best[3]) / score_range
        confidence = min(1.0, max(0.0, confidence * 3))
    else:
        confidence = 0.0
    
    all_scores = [(s[2], float(s[3])) for s in scores[:10]]
    
    return best[0], best[1], best[2], float(confidence), all_scores


def normalize_confidences(candidates):
    """Normalize confidence scores to sum to 1 (softmax-like)."""
    if not candidates:
        return []
    
    scores = np.array([c[1] for c in candidates])
    scores = scores - scores.min()
    exp_scores = np.exp(scores * 5)
    probs = exp_scores / exp_scores.sum()
    
    return [(candidates[i][0], float(probs[i])) for i in range(len(candidates))]


def detect_modulations(y, sr, window_sec=8, hop_sec=4):
    """
    Detect key changes using windowed analysis.
    
    Returns list of segments with key labels and confidences.
    """
    duration = len(y) / sr
    segments = []
    
    if duration < window_sec:
        chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
        pc = chroma.mean(axis=1)
        key, scale, label, conf, _ = detect_key_from_chroma(pc)
        return [{'startSec': 0, 'endSec': duration, 'keyLabel': label, 'confidence': conf}]
    
    window_samples = int(window_sec * sr)
    hop_samples = int(hop_sec * sr)
    
    pos = 0
    while pos < len(y):
        end_pos = min(pos + window_samples, len(y))
        segment_y = y[pos:end_pos]
        
        if len(segment_y) < sr:
            break
        
        chroma = librosa.feature.chroma_cqt(y=segment_y, sr=sr)
        pc = chroma.mean(axis=1)
        key, scale, label, conf, _ = detect_key_from_chroma(pc)
        
        start_sec = pos / sr
        end_sec = end_pos / sr
        
        segments.append({
            'startSec': round(start_sec, 2),
            'endSec': round(end_sec, 2),
            'keyLabel': label,
            'confidence': round(conf, 3)
        })
        
        pos += hop_samples
    
    merged = []
    for seg in segments:
        if not merged:
            merged.append(seg)
            continue
        
        last = merged[-1]
        if last['keyLabel'] == seg['keyLabel'] and seg['confidence'] >= 0.45:
            last['endSec'] = seg['endSec']
            last['confidence'] = max(last['confidence'], seg['confidence'])
        else:
            merged.append(seg)
    
    final = []
    for seg in merged:
        seg_duration = seg['endSec'] - seg['startSec']
        if seg_duration >= 6 or seg['confidence'] >= 0.65:
            final.append(seg)
    
    if not final and merged:
        final = [merged[0]]
    
    return final


def main():
    parser = argparse.ArgumentParser(description='Detect audio key and scale using chroma analysis')
    parser.add_argument('--input', required=True, help='Path to input WAV file')
    parser.add_argument('--out', required=True, help='Output directory')
    args = parser.parse_args()
    
    try:
        os.makedirs(args.out, exist_ok=True)
        
        y, sr = librosa.load(args.input, sr=22050, mono=True)
        duration = len(y) / sr
        
        chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
        pc = chroma.mean(axis=1)
        
        key, scale, key_label, confidence, all_scores = detect_key_from_chroma(pc, return_all=True)
        
        normalized = normalize_confidences(all_scores[:5])
        alt_candidates = [{'keyLabel': c[0], 'confidence': round(c[1], 3)} for c in normalized]
        
        modulations = detect_modulations(y, sr)
        
        result = {
            'key': key,
            'scale': scale,
            'keyLabel': key_label,
            'confidence': round(confidence, 3),
            'altCandidates': alt_candidates,
            'modulations': modulations,
            'duration': round(duration, 2)
        }
        
        analysis_path = os.path.join(args.out, 'analysis.json')
        with open(analysis_path, 'w') as f:
            json.dump(result, f, indent=2)
        
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
