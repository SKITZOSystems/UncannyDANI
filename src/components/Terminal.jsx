export default function Terminal({ transcript = [] }) {
  return (
    <section className="terminal" aria-label="Terminal">
      <header className="terminal-header">
        <span>UNCANNYDANI</span>
        <span>SESSION / 01</span>
      </header>
      <div className="terminal-body">
        {transcript.map((line) => (
          <p key={line.id} className={`terminal-line terminal-line--${line.kind}`}>
            {line.text}
          </p>
        ))}
      </div>
    </section>
  );
}
