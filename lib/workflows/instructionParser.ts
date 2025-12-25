type InstructionSegment = 
  | { type: 'paragraph'; text: string }
  | { type: 'bulletList'; items: string[] };

export function parseInstruction(instruction: string): InstructionSegment[] {
  const segments: InstructionSegment[] = [];
  const lines = instruction.split('\n');
  
  let currentBullets: string[] = [];
  let currentParagraph = '';
  
  const flushParagraph = () => {
    if (currentParagraph.trim()) {
      segments.push({ type: 'paragraph', text: currentParagraph.trim() });
      currentParagraph = '';
    }
  };
  
  const flushBullets = () => {
    if (currentBullets.length > 0) {
      segments.push({ type: 'bulletList', items: [...currentBullets] });
      currentBullets = [];
    }
  };
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (!trimmedLine) {
      flushParagraph();
      flushBullets();
      continue;
    }
    
    if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) {
      flushParagraph();
      const bulletText = trimmedLine.replace(/^[•\-*]\s*/, '').trim();
      if (bulletText) {
        currentBullets.push(bulletText);
      }
    } else {
      flushBullets();
      if (currentParagraph) {
        currentParagraph += ' ' + trimmedLine;
      } else {
        currentParagraph = trimmedLine;
      }
    }
  }
  
  flushParagraph();
  flushBullets();
  
  return segments;
}
