
// Simple synth for Combat sounds
// "Punchy" and "Juicy" sounds using Web Audio API

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

export type CombatSoundType = 'attack_light' | 'attack_heavy' | 'hit' | 'crit' | 'block' | 'evade' | 'heal' | 'buff' | 'debuff'

export function playCombatSound(type: CombatSoundType) {
    try {
        const ctx = initAudio()
        if (!ctx) return

        const t = ctx.currentTime
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()

        // Master Compressor to punch things up
        const compressor = ctx.createDynamicsCompressor()
        compressor.threshold.setValueAtTime(-24, t)
        compressor.knee.setValueAtTime(30, t)
        compressor.ratio.setValueAtTime(12, t)
        compressor.attack.setValueAtTime(0.003, t)
        compressor.release.setValueAtTime(0.25, t)

        osc.connect(gain)
        gain.connect(compressor)
        compressor.connect(ctx.destination)

        switch (type) {
            case 'attack_light': {
                // Swift swish
                osc.type = 'triangle'
                osc.frequency.setValueAtTime(600, t)
                osc.frequency.exponentialRampToValueAtTime(100, t + 0.15)

                gain.gain.setValueAtTime(0.1, t)
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15)

                osc.start(t)
                osc.stop(t + 0.2)
                break
            }
            case 'attack_heavy': {
                // Deep whoosh
                osc.type = 'sawtooth'
                osc.frequency.setValueAtTime(200, t)
                osc.frequency.exponentialRampToValueAtTime(50, t + 0.3)

                // Filter for "heavy" sound
                const filter = ctx.createBiquadFilter()
                filter.type = 'lowpass'
                filter.frequency.setValueAtTime(400, t)
                filter.frequency.linearRampToValueAtTime(100, t + 0.3)

                osc.disconnect()
                osc.connect(filter)
                filter.connect(gain)

                gain.gain.setValueAtTime(0.15, t)
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3)

                osc.start(t)
                osc.stop(t + 0.35)
                break
            }
            case 'hit': {
                // Punchy impact
                osc.type = 'square'
                osc.frequency.setValueAtTime(150, t)
                osc.frequency.exponentialRampToValueAtTime(40, t + 0.1)

                gain.gain.setValueAtTime(0.2, t)
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15)

                // Noise burst for impact
                const noiseNodes = createNoiseBuffer(ctx)
                if (noiseNodes) {
                    const { src: nSrc, gain: nGain } = noiseNodes
                    nSrc.connect(nGain)
                    nGain.connect(compressor)

                    nGain.gain.setValueAtTime(0.15, t)
                    nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1)
                    nSrc.start(t)
                    nSrc.stop(t + 0.1)
                }

                osc.start(t)
                osc.stop(t + 0.2)
                break
            }
            case 'crit': {
                // Sharp high pitch impact + low boom
                osc.type = 'sawtooth'
                osc.frequency.setValueAtTime(800, t)
                osc.frequency.exponentialRampToValueAtTime(100, t + 0.3)

                gain.gain.setValueAtTime(0.2, t)
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3)

                // Sub bass kick
                const sub = ctx.createOscillator()
                const subGain = ctx.createGain()
                sub.type = 'sine'
                sub.frequency.setValueAtTime(60, t)
                sub.frequency.exponentialRampToValueAtTime(30, t + 0.4)
                subGain.gain.setValueAtTime(0.3, t)
                subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4)

                sub.connect(subGain)
                subGain.connect(compressor)

                osc.start(t)
                osc.stop(t + 0.3)
                sub.start(t)
                sub.stop(t + 0.5)
                break
            }
            case 'block': {
                // Metallic clank
                osc.type = 'square'
                osc.frequency.setValueAtTime(800, t)
                osc.frequency.exponentialRampToValueAtTime(400, t + 0.05)

                // Metal needs multiple tones
                const osc2 = ctx.createOscillator()
                osc2.type = 'triangle'
                osc2.frequency.setValueAtTime(540, t)

                const g2 = ctx.createGain()
                osc2.connect(g2)
                g2.connect(compressor)

                gain.gain.setValueAtTime(0.1, t)
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1)
                g2.gain.setValueAtTime(0.1, t)
                g2.gain.exponentialRampToValueAtTime(0.001, t + 0.2)

                osc.start(t)
                osc.stop(t + 0.1)
                osc2.start(t)
                osc2.stop(t + 0.2)
                break
            }
            case 'evade': {
                // Whoosh air
                const noiseNodes = createNoiseBuffer(ctx)
                if (noiseNodes) {
                    const { src: nSrc, gain: nGain } = noiseNodes

                    // Lowpass to make it sound like air
                    const filter = ctx.createBiquadFilter()
                    filter.type = 'lowpass'
                    filter.frequency.setValueAtTime(800, t)
                    filter.frequency.linearRampToValueAtTime(200, t + 0.3)

                    nSrc.disconnect()
                    nSrc.connect(filter)
                    filter.connect(nGain)
                    nGain.connect(compressor)

                    nGain.gain.setValueAtTime(0.1, t)
                    nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.3)
                    nSrc.start(t)
                    nSrc.stop(t + 0.3)
                }
                break
            }
            case 'heal': {
                // Rising shimmer
                osc.type = 'sine'
                osc.frequency.setValueAtTime(400, t)
                osc.frequency.linearRampToValueAtTime(800, t + 0.5)

                const lfo = ctx.createOscillator()
                lfo.frequency.value = 10
                const lfoGain = ctx.createGain()
                lfoGain.gain.value = 500
                lfo.connect(lfoGain)
                lfoGain.connect(osc.frequency)
                lfo.start(t)
                lfo.stop(t + 0.5)

                gain.gain.setValueAtTime(0.0, t)
                gain.gain.linearRampToValueAtTime(0.1, t + 0.1)
                gain.gain.linearRampToValueAtTime(0, t + 0.5)

                osc.start(t)
                osc.stop(t + 0.5)
                break
            }
        }
    } catch {
        // ignore
    }
}

function createNoiseBuffer(ctx: AudioContext) {
    try {
        const bufferSize = ctx.sampleRate * 2 // 2 seconds
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
        const data = buffer.getChannelData(0)

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1
        }

        const noiseNode = ctx.createBufferSource()
        noiseNode.buffer = buffer
        const gainNode = ctx.createGain()
        noiseNode.connect(gainNode)
        return { src: noiseNode, gain: gainNode }
    } catch {
        return null
    }
}
