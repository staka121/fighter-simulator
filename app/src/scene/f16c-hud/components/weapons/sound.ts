// Synthesized missile-launch sound via the Web Audio API — a quick descending
// pitch sweep with a fast attack/decay. No asset needed. Created lazily on the
// first fire (a tap is a user gesture, so the AudioContext is allowed to start).
// Fails silently if Web Audio is unavailable in the WebView.
let ctx: AudioContext | null = null

export function playLaunchSound(): void {
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()

    const t = ctx.currentTime
    const dur = 1.6

    // Rocket-motor whoosh = filtered white noise (a tone sounds arcade-y). Keep
    // it a hiss: a highpass removes the low "boom" that reads as a bang, and a
    // swelling attack avoids the transient click.
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    const noise = ctx.createBufferSource()
    noise.buffer = buffer

    // Keep low-mid "roar" body but cut the sub-boom.
    const hp = ctx.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = 150

    // Lowpass sweeps from bright ("shu" onset) down into a sustained roar ("go").
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.setValueAtTime(5500, t)
    lp.frequency.exponentialRampToValueAtTime(1400, t + 0.35)

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(0.55, t + 0.06) // quick "shu" onset, not a click
    // Gradual, ever-decreasing fade to silence.
    gain.gain.exponentialRampToValueAtTime(0.3, t + 0.55)
    gain.gain.exponentialRampToValueAtTime(0.1, t + 1.1)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)

    noise.connect(hp).connect(lp).connect(gain).connect(ctx.destination)
    noise.start(t)
    noise.stop(t + dur)
  } catch (e) {
    console.error('launch sound failed:', e)
  }
}

/** Empty-magazine buzzer — two short low square-wave pulses ("bu-bu"). */
export function playEmptySound(): void {
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()

    const t = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'square'
    osc.frequency.setValueAtTime(150, t)

    // Two clipped pulses.
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(0.22, t + 0.01)
    gain.gain.setValueAtTime(0.22, t + 0.08)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.1)
    gain.gain.exponentialRampToValueAtTime(0.22, t + 0.15)
    gain.gain.setValueAtTime(0.22, t + 0.22)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.24)

    osc.connect(gain).connect(ctx.destination)
    osc.start(t)
    osc.stop(t + 0.26)
  } catch (e) {
    console.error('empty sound failed:', e)
  }
}
