"use client";

export function Colophon() {
  return (
    <footer style={{
      padding: 'calc(var(--pad-y) * 1.2) var(--pad-x) calc(var(--pad-y) * .8)',
      borderTop: '.5px solid var(--hairline)',
      marginTop: 80,
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 32,
        marginBottom: 40,
      }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Colophon</div>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--ink-2)' }}>
            Proof is a private journal for one baker. Recipes are kept as formulas; bakes as notes. The fridge is your friend.
          </p>
        </div>
        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>This Issue</div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, color: 'var(--ink-2)' }}>
            <li>Vol. III · № 05</li>
            <li>May · MMXXVI</li>
            <li>Kitchen, North Window</li>
          </ul>
        </div>
        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Type</div>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--ink-2)' }}>
            Set in Cormorant Garamond &amp; Newsreader. Numerals in JetBrains Mono. Printed on paper, served on screen.
          </p>
        </div>
        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Practice</div>
          <p className="italic" style={{ fontSize: 17, lineHeight: 1.4, color: 'var(--ink)' }}>
            Slow. Considered. Repeat until the loaf surprises you.
          </p>
        </div>
      </div>
      <div className="mono" style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 10.5,
        letterSpacing: '.16em',
        textTransform: 'uppercase',
        color: 'var(--muted)',
        paddingTop: 18,
        borderTop: '.5px solid var(--hairline)',
      }}>
        <span>© MMXXVI · Proof</span>
        <span>End of Issue</span>
      </div>
    </footer>
  );
}
