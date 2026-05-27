export function Topbar({
  eyebrow,
  title,
  text,
  actions,
}: {
  eyebrow: string;
  title: string;
  text: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="topbar">
      <div className="titleBlock">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{text}</p>
      </div>
      {actions ? <div className="actions">{actions}</div> : null}
    </header>
  );
}
