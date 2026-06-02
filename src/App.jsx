import { useEffect, useMemo, useRef, useState } from 'react';
import Terminal from './components/Terminal';
import BootSequence from './components/BootSequence';
import PromptEngine from './components/PromptEngine';
import GlitchLayer from './components/GlitchLayer';
import {
  appendMemoryList,
  readMemoryList,
  readNarrativeState,
  resetSession,
  writeMemory,
  writeNarrativeState
} from './engine/memoryStore';
import {
  calculateAnomalyDelta,
  buildMemoryIllusionProfile,
  calculateCadenceProfile,
  calculateResponseDelayMs,
  calculateWordVariance,
  deriveMemoryRecallTone
} from './engine/driftLogic';
import { buildResponse } from './engine/psycheEngine';

const BOOT_DURATION_SECONDS = 60;
const DEFAULT_TRANSCRIPT = [
  { id: 'boot-1', kind: 'system', text: '> boot complete' },
  { id: 'boot-2', kind: 'system', text: '> stabilization complete' },
  { id: 'boot-3', kind: 'system', text: '> listening for input' }
];
const RESET_COMMANDS = new Set(['/reset', 'reset', '/recalibrate', 'recalibrate', '/reboot', 'reboot']);

function buildHiddenStateSnapshot(persistedState) {
  return {
    anomalyScore: persistedState?.hiddenState?.anomalyScore ?? 0,
    skippedFrames: persistedState?.hiddenState?.skippedFrames ?? 0,
    phase: persistedState?.hiddenState?.phase ?? 'normal',
    inputCount: persistedState?.hiddenState?.inputCount ?? 0
  };
}

function buildTranscriptSnapshot(persistedState) {
  if (Array.isArray(persistedState?.transcript) && persistedState.transcript.length > 0) {
    return persistedState.transcript;
  }

  return DEFAULT_TRANSCRIPT;
}

export default function App() {
  const persistedNarrativeState = readNarrativeState();
  const [elapsedSeconds, setElapsedSeconds] = useState(persistedNarrativeState?.elapsedSeconds ?? 0);
  const [booted, setBooted] = useState(persistedNarrativeState?.bootCompleted ?? false);
  const [transcript, setTranscript] = useState(() => buildTranscriptSnapshot(persistedNarrativeState));
  const [promptValue, setPromptValue] = useState('');
  const [promptReadyAt, setPromptReadyAt] = useState(null);
  const [lastExchange, setLastExchange] = useState(persistedNarrativeState?.lastExchange ?? null);
  const [isProcessing, setIsProcessing] = useState(false);
  const hiddenState = useRef(buildHiddenStateSnapshot(persistedNarrativeState));
  const responseTimerRef = useRef(null);
  const typingIntervalsRef = useRef([]);
  const lastKeyAtRef = useRef(null);
  const promptText = useMemo(() => '[DANI_SYS] ENTER RESPONSE VECTOR:', []);

  function clearRuntimeTimers() {
    if (responseTimerRef.current !== null) {
      window.clearTimeout(responseTimerRef.current);
      responseTimerRef.current = null;
    }
  }

  function snapshotNarrative(nextState) {
    return writeNarrativeState({
      bootCompleted: nextState.bootCompleted,
      elapsedSeconds: nextState.elapsedSeconds,
      transcript: nextState.transcript,
      hiddenState: nextState.hiddenState,
      lastExchange: nextState.lastExchange
    });
  }

  function softReset() {
    clearRuntimeTimers();
    resetSession();
    hiddenState.current.anomalyScore = 0;
    hiddenState.current.skippedFrames = 0;
    hiddenState.current.phase = 'normal';
    hiddenState.current.inputCount = 0;
    typingIntervalsRef.current = [];
    lastKeyAtRef.current = null;
    setElapsedSeconds(0);
    setBooted(false);
    setTranscript(DEFAULT_TRANSCRIPT);
    setPromptValue('');
    setPromptReadyAt(null);
    setLastExchange(null);
    setIsProcessing(false);
    snapshotNarrative({
      bootCompleted: false,
      elapsedSeconds: 0,
      transcript: DEFAULT_TRANSCRIPT,
      hiddenState: hiddenState.current,
      lastExchange: null
    });
  }

  useEffect(() => {
    if (booted) {
      clearRuntimeTimers();
      return undefined;
    }

    const timer = window.setInterval(() => {
      setElapsedSeconds((currentSeconds) => {
        const nextSeconds = Math.min(currentSeconds + 1, BOOT_DURATION_SECONDS);

        if (nextSeconds === 60) {
          setBooted(true);
          window.clearInterval(timer);
        }

        return nextSeconds;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [booted]);

  useEffect(() => {
    if (!booted && elapsedSeconds < 10) {
      hiddenState.current.phase = 'normal';
      snapshotNarrative({
        bootCompleted: booted,
        elapsedSeconds,
        transcript,
        hiddenState: hiddenState.current,
        lastExchange
      });
      return;
    }

    if (!booted && elapsedSeconds < 25) {
      hiddenState.current.anomalyScore += 1;
      hiddenState.current.phase = 'drift';
      snapshotNarrative({
        bootCompleted: booted,
        elapsedSeconds,
        transcript,
        hiddenState: hiddenState.current,
        lastExchange
      });
      return;
    }

    if (!booted && elapsedSeconds < 40) {
      hiddenState.current.anomalyScore += 2;
      hiddenState.current.phase = 'recognition';
      snapshotNarrative({
        bootCompleted: booted,
        elapsedSeconds,
        transcript,
        hiddenState: hiddenState.current,
        lastExchange
      });
      return;
    }

    if (!booted && elapsedSeconds < 55) {
      hiddenState.current.skippedFrames += 1;
      hiddenState.current.phase = 'instability';
      snapshotNarrative({
        bootCompleted: booted,
        elapsedSeconds,
        transcript,
        hiddenState: hiddenState.current,
        lastExchange
      });
      return;
    }

    hiddenState.current.phase = 'stabilization';
    snapshotNarrative({
      bootCompleted: booted,
      elapsedSeconds,
      transcript,
      hiddenState: hiddenState.current,
      lastExchange
    });
  }, [elapsedSeconds, booted, transcript, lastExchange]);

  useEffect(() => {
    if (booted && promptReadyAt === null) {
      setPromptReadyAt(Date.now());
    }
  }, [booted, promptReadyAt]);

  useEffect(() => {
    return () => {
      if (responseTimerRef.current !== null) {
        window.clearTimeout(responseTimerRef.current);
      }
    };
  }, []);

  function handlePromptKeyDown(event) {
    const keyTime = Date.now();

    if (lastKeyAtRef.current !== null) {
      typingIntervalsRef.current.push(keyTime - lastKeyAtRef.current);
    }

    lastKeyAtRef.current = keyTime;
  }

  function handlePromptSubmit(event) {
    event.preventDefault();

    if (isProcessing) {
      return;
    }

    const rawText = promptValue;
    const normalizedCommand = rawText.trim().toLowerCase();

    if (RESET_COMMANDS.has(normalizedCommand)) {
      softReset();
      return;
    }

    const submittedAt = Date.now();
    const hesitationMs = promptReadyAt === null ? 0 : submittedAt - promptReadyAt;
    const wordVariance = calculateWordVariance(rawText);
    const inputHistory = readMemoryList('uncanny:inputs');
    const cadenceProfile = calculateCadenceProfile(typingIntervalsRef.current);
    const anomalyDelta = calculateAnomalyDelta({
      length: wordVariance.length,
      hesitationMs,
      repeatedWords: wordVariance.repeatedWords,
      uniqueRatio: wordVariance.uniqueRatio
    });
    const cadenceAnomalyDelta = cadenceProfile.cadenceLabel === 'hesitant' ? 2 : cadenceProfile.cadenceLabel === 'uneven' ? 1 : 0;
    const totalAnomalyDelta = anomalyDelta + cadenceAnomalyDelta;
    const responseDelayMs = calculateResponseDelayMs({
      anomalyScore: hiddenState.current.anomalyScore + totalAnomalyDelta,
      length: wordVariance.length,
      averageIntervalMs: cadenceProfile.averageIntervalMs,
      repeatedWords: wordVariance.repeatedWords
    });
    const memoryIllusion = buildMemoryIllusionProfile({
      history: inputHistory,
      inputCount: hiddenState.current.inputCount + 1,
      anomalyScore: hiddenState.current.anomalyScore + totalAnomalyDelta,
      cadenceLabel: cadenceProfile.cadenceLabel
    });

    hiddenState.current.anomalyScore += totalAnomalyDelta;
    hiddenState.current.inputCount += 1;

    const exchange = {
      id: `input-${hiddenState.current.inputCount}`,
      rawText,
      submittedAt,
      hesitationMs,
      length: wordVariance.length,
      uniqueRatio: wordVariance.uniqueRatio,
      repeatedWords: wordVariance.repeatedWords,
      anomalyDelta: totalAnomalyDelta,
      cadenceLabel: cadenceProfile.cadenceLabel,
      averageKeyIntervalMs: cadenceProfile.averageIntervalMs,
      pauseCount: cadenceProfile.pauseCount,
      responseDelayMs,
      referenceTag: memoryIllusion.shouldReferencePriorState ? `prior-${memoryIllusion.referenceIndex + 1}` : 'present',
      interpretationLayer: memoryIllusion.interpretationLayer,
      visibilityStatus: memoryIllusion.shouldReferencePriorState ? 'recontextualized' : 'present'
    };

    writeMemory('uncanny:lastInput', exchange);
    appendMemoryList('uncanny:inputs', exchange);

    const transcriptWithPending = [
      ...transcript,
      {
        id: `${exchange.id}:input`,
        kind: 'user',
        text: `> ${rawText || '[silence]'}`
      },
      {
        id: `${exchange.id}:pending`,
        kind: 'system',
        text: `PROCESSING: cadence evaluation in progress (${responseDelayMs}ms)`
      }
    ].slice(-10);

    setTranscript(transcriptWithPending);

    setLastExchange(exchange);
    setPromptValue('');
    setPromptReadyAt(Date.now());
    typingIntervalsRef.current = [];
    lastKeyAtRef.current = null;
    setIsProcessing(true);

    if (responseTimerRef.current !== null) {
      window.clearTimeout(responseTimerRef.current);
    }

    responseTimerRef.current = window.setTimeout(() => {
      const responseLines = buildResponse({
        text: rawText,
        anomalyScore: hiddenState.current.anomalyScore,
        repeatedWords: wordVariance.repeatedWords,
        uniqueRatio: wordVariance.uniqueRatio,
        cadenceLabel: cadenceProfile.cadenceLabel,
        inputCount: hiddenState.current.inputCount,
        memoryIllusion: {
          ...memoryIllusion,
          tone: deriveMemoryRecallTone(hiddenState.current.anomalyScore, cadenceProfile.cadenceLabel)
        }
      });

      const finalTranscript = [
        ...transcriptWithPending.filter((line) => line.id !== `${exchange.id}:pending`),
        ...responseLines.map((line, index) => ({
          id: `${exchange.id}:response-${index}`,
          kind: 'system',
          text: line
        }))
      ].slice(-10);

      setTranscript(finalTranscript);
      snapshotNarrative({
        bootCompleted: true,
        elapsedSeconds,
        transcript: finalTranscript,
        hiddenState: hiddenState.current,
        lastExchange: exchange
      });

      setIsProcessing(false);
    }, responseDelayMs);

    snapshotNarrative({
      bootCompleted: true,
      elapsedSeconds,
      transcript: transcriptWithPending,
      hiddenState: hiddenState.current,
      lastExchange: exchange
    });
  }

  return (
    <main className={`app-shell ${booted ? 'is-booted' : 'is-booting'}`}>
      <GlitchLayer />
      {booted ? (
        <Terminal transcript={transcript} />
      ) : (
        <BootSequence elapsedSeconds={elapsedSeconds} hiddenState={hiddenState} />
      )}
      {booted ? (
        <PromptEngine
          active
          promptText={promptText}
          value={promptValue}
          onChange={setPromptValue}
          onKeyDown={handlePromptKeyDown}
          onSubmit={handlePromptSubmit}
          lastExchange={lastExchange}
          disabled={isProcessing}
        />
      ) : null}
    </main>
  );
}
