// Simple synth for UI sounds (safe to ignore failures due to autoplay restrictions)
const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext
let audioCtx: AudioContext | null = null

function initAudio() {
  if (!AudioContextCtor) return null
  if (!audioCtx) audioCtx = new AudioContextCtor()
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => undefined)
  }
  return audioCtx
}

export type DatapadSound = 'click' | 'boot' | 'blip' | 'scan_start' | 'scan_success' | 'error'

export function playSound(type: DatapadSound) {
  try {
    const ctx = initAudio()
    if (!ctx) return

    const t = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    switch (type) {
      case 'click': {
        osc.type = 'square'
        osc.frequency.setValueAtTime(600, t)
        osc.frequency.exponentialRampToValueAtTime(100, t + 0.04)
        gain.gain.setValueAtTime(0.05, t)
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04)
        osc.start(t)
        osc.stop(t + 0.05)
        return
      }
      case 'boot': {
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(50, t)
        osc.frequency.linearRampToValueAtTime(400, t + 0.6)
        gain.gain.setValueAtTime(0.08, t)
        gain.gain.linearRampToValueAtTime(0, t + 0.6)
        osc.start(t)
        osc.stop(t + 0.6)

        const noiseOsc = ctx.createOscillator()
        const noiseGain = ctx.createGain()
        noiseOsc.connect(noiseGain)
        noiseGain.connect(ctx.destination)
        noiseOsc.type = 'square'
        noiseOsc.frequency.setValueAtTime(200, t)
        noiseGain.gain.setValueAtTime(0.02, t)
        noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.8)
        noiseOsc.start(t)
        noiseOsc.stop(t + 0.8)
        return
      }
      case 'blip': {
        osc.type = 'sine'
        osc.frequency.setValueAtTime(1200, t)
        gain.gain.setValueAtTime(0.05, t)
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15)
        osc.start(t)
        osc.stop(t + 0.15)
        return
      }
      case 'scan_start': {
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(300, t)
        osc.frequency.linearRampToValueAtTime(800, t + 0.2)
        gain.gain.setValueAtTime(0.05, t)
        gain.gain.linearRampToValueAtTime(0, t + 0.2)
        osc.start(t)
        osc.stop(t + 0.2)
        return
      }
      case 'scan_success': {
        osc.type = 'sine'
        osc.frequency.setValueAtTime(1200, t)
        osc.frequency.setValueAtTime(1200, t + 0.1)
        osc.frequency.setValueAtTime(2000, t + 0.1)

        gain.gain.setValueAtTime(0.1, t)
        gain.gain.setValueAtTime(0.1, t + 0.08)
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3)

        osc.start(t)
        osc.stop(t + 0.3)
        return
      }
      case 'error': {
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(200, t)
        osc.frequency.exponentialRampToValueAtTime(50, t + 0.3)
        gain.gain.setValueAtTime(0.08, t)
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3)
        osc.start(t)
        osc.stop(t + 0.3)
      }
    }
  } catch {
    // ignore
  }
}

