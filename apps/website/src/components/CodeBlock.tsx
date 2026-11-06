export default function CodeBlock({ code, label }: { code: string; label?: string }) {
  return (
    <figure className="code-figure">
      {label ? <figcaption>{label}</figcaption> : null}
      <pre className="code-block">
        <code>{code}</code>
      </pre>
    </figure>
  );
}
