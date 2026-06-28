export default function PageContent({ children, className = "" }) {
  return (
    <div className={`module-shell w-full flex-1 min-h-0 ${className}`.trim()}>{children}</div>
  );
}
