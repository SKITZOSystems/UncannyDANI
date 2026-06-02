export default function PromptEngine({
  active = false,
  promptText = '[DANI_SYS] ENTER RESPONSE VECTOR:',
  value = '',
  onChange,
  onKeyDown,
  onSubmit,
  lastExchange = null,
  disabled = false
}) {
  if (!active) {
    return null;
  }

  return (
    <section className="prompt-engine" aria-label="Prompt engine">
      <form className="prompt-engine__form" onSubmit={onSubmit}>
        <label className="prompt-engine__label" htmlFor="dani-response">
          {promptText}
        </label>
        <div className="prompt-engine__row">
          <span className="prompt-engine__chevron">&gt;</span>
          <input
            id="dani-response"
            className="prompt-engine__input"
            type="text"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={onKeyDown}
            autoComplete="off"
            spellCheck="false"
            autoCapitalize="off"
            autoCorrect="off"
            aria-describedby={lastExchange ? 'dani-response-meta' : undefined}
            disabled={disabled}
            autoFocus
          />
        </div>
        {lastExchange ? (
          <p id="dani-response-meta" className="prompt-engine__meta">
            length {lastExchange.length} / hesitation {Math.round(lastExchange.hesitationMs / 100) / 10}s / cadence {lastExchange.cadenceLabel} / anomaly +{lastExchange.anomalyDelta}
          </p>
        ) : null}
      </form>
    </section>
  );
}
