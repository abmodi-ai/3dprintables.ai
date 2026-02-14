export const playSound = (freq, type = 'sine', duration = 0.1, volume = 0.1) => {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;

        const audioCtx = new AudioContext();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);

        gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + duration);

        // Close context after play to save resources
        setTimeout(() => audioCtx.close(), (duration + 0.1) * 1000);
    } catch (e) {
        console.warn('Audio play failed', e);
    }
};

export const playClink = () => playSound(1200, 'triangle', 0.1, 0.05);
export const playHum = () => playSound(150, 'sine', 0.2, 0.1);
export const playGrab = () => {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const audioCtx = new AudioContext();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(200, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.1);
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.1);
        setTimeout(() => audioCtx.close(), 200);
    } catch (e) { }
};

// Advanced Ambient Synthesizer
let ambientCtx = null;
export const startLabAmbient = () => {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;

        ambientCtx = new AudioContext();

        // 1. Heavy Fan Noise (White Noise + Filter)
        const bufferSize = ambientCtx.sampleRate * 2;
        const buffer = ambientCtx.createBuffer(1, bufferSize, ambientCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const whiteNoise = ambientCtx.createBufferSource();
        whiteNoise.buffer = buffer;
        whiteNoise.loop = true;

        const filter = ambientCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1500;

        const fanGain = ambientCtx.createGain();
        fanGain.gain.value = 0.01; // Extremely subtle

        // 2. Machine Hum (Low Frequency)
        const hum = ambientCtx.createOscillator();
        hum.type = 'sine';
        hum.frequency.value = 60;
        const humGain = ambientCtx.createGain();
        humGain.gain.value = 0.005;

        whiteNoise.connect(filter);
        filter.connect(fanGain);
        fanGain.connect(ambientCtx.destination);

        hum.connect(humGain);
        humGain.connect(ambientCtx.destination);

        whiteNoise.start();
        hum.start();

        return () => {
            if (ambientCtx) {
                ambientCtx.close();
                ambientCtx = null;
            }
        };
    } catch (e) {
        console.error('Ambient synthesis failed', e);
        return () => { };
    }
};
