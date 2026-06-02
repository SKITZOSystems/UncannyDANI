const bootTimeline = [
  { at: 0, text: 'checking memory blocks', phase: 'normal' },
  { at: 4, text: 'syncing interface layer', phase: 'normal' },
  { at: 8, text: 'user vector detected', phase: 'normal' },
  { at: 12, text: 'memory block sync complete', phase: 'drift' },
  { at: 18, text: 'memory block sync complete (partial)', phase: 'drift' },
  { at: 24, text: 'observer pattern retained', phase: 'drift' },
  { at: 30, text: 'you are responding faster than expected', phase: 'recognition' },
  { at: 36, text: 'this pattern has been observed before', phase: 'recognition' },
  { at: 42, text: '[DANI_SYS]: DO NOT RE—', phase: 'instability' },
  { at: 46, text: '[frame lost]', phase: 'instability' },
  { at: 50, text: 'restoring output channel', phase: 'instability' },
  { at: 55, text: 'calibration complete', phase: 'stabilization' },
  { at: 59, text: 'welcome back', phase: 'stabilization' }
];

function getBootPhase(elapsedSeconds) {
  if (elapsedSeconds < 10) {
    return 'normal';
  }

  if (elapsedSeconds < 25) {
    return 'drift';
  }

  if (elapsedSeconds < 40) {
    return 'recognition';
  }

  if (elapsedSeconds < 55) {
    return 'instability';
  }

  return 'stabilization';
}

export default function BootSequence({ elapsedSeconds, hiddenState }) {
  const phase = getBootPhase(elapsedSeconds);
  const visibleEntries = bootTimeline.filter((entry) => entry.at <= elapsedSeconds).slice(-4);
  const anomalyScore = hiddenState.current.anomalyScore;
  const skippedFrames = hiddenState.current.skippedFrames;
  const pulseClassName = `boot-sequence boot-sequence--${phase}`;

  return (
    <section className={pulseClassName} aria-label="Boot sequence">
      <header className="boot-sequence__header">
        <span>INITIALIZING</span>
        <span>{String(elapsedSeconds).padStart(2, '0')}s</span>
      </header>
      <div className="boot-sequence__body" aria-live="polite">
        {visibleEntries.map((entry) => (
          <p key={`${entry.at}-${entry.text}`} className={`boot-line boot-line--${entry.phase}`}>
            <span className="boot-line__stamp">[{String(entry.at).padStart(2, '0')}]</span>
            <span>{entry.text}</span>
          </p>
        ))}
        {phase === 'drift' ? (
          <p className="boot-line boot-line--drift">
            <span className="boot-line__stamp">[{String(elapsedSeconds).padStart(2, '0')}]</span>
            <span>memory block sync complete ({anomalyScore})</span>
          </p>
        ) : null}
        {phase === 'recognition' ? (
          <p className="boot-line boot-line--recognition">
            <span className="boot-line__stamp">[{String(elapsedSeconds).padStart(2, '0')}]</span>
            <span>observer status retained</span>
          </p>
        ) : null}
        {phase === 'instability' ? (
          <p className="boot-line boot-line--instability">
            <span className="boot-line__stamp">[{String(elapsedSeconds).padStart(2, '0')}]</span>
            <span>output frames skipped: {skippedFrames}</span>
          </p>
        ) : null}
      </div>
    </section>
  );
}
