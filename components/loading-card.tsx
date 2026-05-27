export function LoadingCard({ lines = 3 }: { lines?: number }) {
  return (
    <article className="card loadingCard" aria-label="Cargando">
      <span className="skeleton skeletonIcon" />
      {Array.from({ length: lines }).map((_, index) => (
        <span className="skeleton skeletonLine" key={index} />
      ))}
    </article>
  );
}
