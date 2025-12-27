class VocalDoublerProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'mix', defaultValue: 0.5, minValue: 0, maxValue: 1, automationRate: 'a-rate' },
      { name: 'width', defaultValue: 1.0, minValue: 0, maxValue: 1.5, automationRate: 'a-rate' },
      { name: 'baseDelay', defaultValue: 20, minValue: 5, maxValue: 40, automationRate: 'a-rate' },
      { name: 'range', defaultValue: 5, minValue: 0, maxValue: 25, automationRate: 'a-rate' },
      { name: 'wow', defaultValue: 0.3, minValue: 0, maxValue: 1, automationRate: 'a-rate' },
      { name: 'flutter', defaultValue: 0.2, minValue: 0, maxValue: 1, automationRate: 'a-rate' },
      { name: 'satDrive', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'a-rate' },
      { name: 'satTone', defaultValue: 12000, minValue: 6000, maxValue: 18000, automationRate: 'a-rate' },
      { name: 'panA', defaultValue: -0.3, minValue: -1, maxValue: 1, automationRate: 'a-rate' },
      { name: 'panB', defaultValue: 0.3, minValue: -1, maxValue: 1, automationRate: 'a-rate' },
      { name: 'phaseInvert', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'k-rate' },
      { name: 'lowLatency', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'k-rate' },
      { name: 'lfoRate', defaultValue: 0.5, minValue: 0.05, maxValue: 6, automationRate: 'a-rate' },
    ];
  }

  constructor() {
    super();
    
    this.sampleRate = sampleRate;
    const maxDelayMs = 200;
    this.maxDelaySamples = Math.ceil((maxDelayMs / 1000) * this.sampleRate);
    
    this.delayBufferL = new Float32Array(this.maxDelaySamples);
    this.delayBufferR = new Float32Array(this.maxDelaySamples);
    this.writeIndex = 0;
    
    this.wanderL = 0;
    this.wanderR = 0;
    this.wanderUpdateCounter = 0;
    this.wanderUpdateInterval = 256;
    
    this.lfoPhase = 0;
    
    this.smoothMix = 0.5;
    this.smoothWidth = 1.0;
    this.smoothBaseDelay = 20;
    this.smoothRange = 5;
    this.smoothWow = 0.3;
    this.smoothFlutter = 0.2;
    this.smoothSatDrive = 0;
    this.smoothSatTone = 12000;
    this.smoothPanA = -0.3;
    this.smoothPanB = 0.3;
    this.smoothLfoRate = 0.5;
    
    this.lpStateL = 0;
    this.lpStateR = 0;
  }

  getParamValue(param, index) {
    return param.length > 1 ? param[index] : param[0];
  }

  smoothParam(current, target, coeff = 0.005) {
    return current + coeff * (target - current);
  }

  random() {
    return Math.random() * 2 - 1;
  }

  updateWander() {
    const wanderStep = 0.02;
    this.wanderL += this.random() * wanderStep;
    this.wanderR += this.random() * wanderStep;
    this.wanderL = Math.max(-1, Math.min(1, this.wanderL));
    this.wanderR = Math.max(-1, Math.min(1, this.wanderR));
  }

  readDelayInterpolated(buffer, readPos) {
    const len = buffer.length;
    const idx0 = Math.floor(readPos);
    const idx1 = (idx0 + 1) % len;
    const frac = readPos - idx0;
    const safeIdx0 = ((idx0 % len) + len) % len;
    const safeIdx1 = ((idx1 % len) + len) % len;
    return buffer[safeIdx0] * (1 - frac) + buffer[safeIdx1] * frac;
  }

  saturate(x, drive) {
    if (drive <= 0) return x;
    const preGain = 1 + drive * 3;
    const driven = x * preGain;
    const sat = Math.tanh(driven);
    return sat / preGain * (1 + drive * 0.5);
  }

  lowpass(input, state, cutoff, sr) {
    const rc = 1.0 / (2 * Math.PI * cutoff);
    const dt = 1.0 / sr;
    const alpha = dt / (rc + dt);
    const out = state + alpha * (input - state);
    return out;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    
    if (!input || !input[0]) {
      return true;
    }

    const inputL = input[0];
    const inputR = input[1] || input[0];
    const outputL = output[0];
    const outputR = output[1] || output[0];
    
    const blockSize = inputL.length;
    
    for (let i = 0; i < blockSize; i++) {
      const mix = this.getParamValue(parameters.mix, i);
      const width = this.getParamValue(parameters.width, i);
      const baseDelay = this.getParamValue(parameters.baseDelay, i);
      const range = this.getParamValue(parameters.range, i);
      const wow = this.getParamValue(parameters.wow, i);
      const flutter = this.getParamValue(parameters.flutter, i);
      const satDrive = this.getParamValue(parameters.satDrive, i);
      const satTone = this.getParamValue(parameters.satTone, i);
      const panA = this.getParamValue(parameters.panA, i);
      const panB = this.getParamValue(parameters.panB, i);
      const phaseInvert = this.getParamValue(parameters.phaseInvert, 0) > 0.5;
      const lowLatency = this.getParamValue(parameters.lowLatency, 0) > 0.5;
      const lfoRate = this.getParamValue(parameters.lfoRate, i);
      
      this.smoothMix = this.smoothParam(this.smoothMix, mix);
      this.smoothWidth = this.smoothParam(this.smoothWidth, width);
      this.smoothBaseDelay = this.smoothParam(this.smoothBaseDelay, baseDelay, 0.002);
      this.smoothRange = this.smoothParam(this.smoothRange, range, 0.002);
      this.smoothWow = this.smoothParam(this.smoothWow, wow);
      this.smoothFlutter = this.smoothParam(this.smoothFlutter, flutter);
      this.smoothSatDrive = this.smoothParam(this.smoothSatDrive, satDrive);
      this.smoothSatTone = this.smoothParam(this.smoothSatTone, satTone, 0.001);
      this.smoothPanA = this.smoothParam(this.smoothPanA, panA);
      this.smoothPanB = this.smoothParam(this.smoothPanB, panB);
      this.smoothLfoRate = this.smoothParam(this.smoothLfoRate, lfoRate, 0.001);
      
      this.wanderUpdateCounter++;
      if (this.wanderUpdateCounter >= this.wanderUpdateInterval) {
        this.wanderUpdateCounter = 0;
        this.updateWander();
      }
      
      const lfoInc = (this.smoothLfoRate * 2 * Math.PI) / this.sampleRate;
      this.lfoPhase += lfoInc;
      if (this.lfoPhase > 2 * Math.PI) this.lfoPhase -= 2 * Math.PI;
      
      const lfoVal = Math.sin(this.lfoPhase);
      const flutterNoiseL = this.random() * 0.1;
      const flutterNoiseR = this.random() * 0.1;
      
      let modL, modR;
      let effectiveRange = this.smoothRange;
      let effectiveWow = this.smoothWow;
      let effectiveFlutter = this.smoothFlutter;
      
      if (lowLatency) {
        effectiveRange = Math.min(effectiveRange, 5);
        effectiveWow = 0;
        effectiveFlutter = 0;
      }
      
      modL = effectiveRange * (
        effectiveWow * this.wanderL +
        effectiveFlutter * (lfoVal + flutterNoiseL)
      );
      modR = effectiveRange * (
        effectiveWow * this.wanderR +
        effectiveFlutter * (lfoVal + flutterNoiseR)
      );
      
      modL *= this.smoothWidth;
      modR *= this.smoothWidth;
      
      let delayMsL = this.smoothBaseDelay + modL;
      let delayMsR = this.smoothBaseDelay + modR;
      
      delayMsL = Math.max(1, Math.min(199, delayMsL));
      delayMsR = Math.max(1, Math.min(199, delayMsR));
      
      const delaySamplesL = (delayMsL / 1000) * this.sampleRate;
      const delaySamplesR = (delayMsR / 1000) * this.sampleRate;
      
      this.delayBufferL[this.writeIndex] = inputL[i];
      this.delayBufferR[this.writeIndex] = inputR[i];
      
      let readPosL = this.writeIndex - delaySamplesL;
      let readPosR = this.writeIndex - delaySamplesR;
      if (readPosL < 0) readPosL += this.maxDelaySamples;
      if (readPosR < 0) readPosR += this.maxDelaySamples;
      
      let wetL = this.readDelayInterpolated(this.delayBufferL, readPosL);
      let wetR = this.readDelayInterpolated(this.delayBufferR, readPosR);
      
      if (this.smoothSatDrive > 0.01) {
        wetL = this.saturate(wetL, this.smoothSatDrive);
        wetR = this.saturate(wetR, this.smoothSatDrive);
        
        this.lpStateL = this.lowpass(wetL, this.lpStateL, this.smoothSatTone, this.sampleRate);
        this.lpStateR = this.lowpass(wetR, this.lpStateR, this.smoothSatTone, this.sampleRate);
        wetL = this.lpStateL;
        wetR = this.lpStateR;
      }
      
      if (phaseInvert) {
        wetL = -wetL;
        wetR = -wetR;
      }
      
      const panLGainL = Math.cos((this.smoothPanA + 1) * Math.PI / 4);
      const panLGainR = Math.sin((this.smoothPanA + 1) * Math.PI / 4);
      const panRGainL = Math.cos((this.smoothPanB + 1) * Math.PI / 4);
      const panRGainR = Math.sin((this.smoothPanB + 1) * Math.PI / 4);
      
      const pannedWetL = wetL * panLGainL + wetR * panRGainL;
      const pannedWetR = wetL * panLGainR + wetR * panRGainR;
      
      const dryL = inputL[i];
      const dryR = inputR[i];
      
      const dryGain = Math.cos(this.smoothMix * Math.PI / 2);
      const wetGain = Math.sin(this.smoothMix * Math.PI / 2);
      
      outputL[i] = dryL * dryGain + pannedWetL * wetGain;
      outputR[i] = dryR * dryGain + pannedWetR * wetGain;
      
      this.writeIndex = (this.writeIndex + 1) % this.maxDelaySamples;
    }
    
    return true;
  }
}

registerProcessor('vocal-doubler-processor', VocalDoublerProcessor);
