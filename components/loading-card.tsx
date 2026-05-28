import { Card } from "@/components/ui";

export function LoadingCard({ lines = 3 }: { lines?: number }) {
  return (
    <Card className="loadingCard" aria-label="Cargando">
      <span className="skeleton skeletonIcon" />
      {Array.from({ length: lines }).map((_, index) => (
        <span className="skeleton skeletonLine" key={index} />
      ))}
    </Card>
  );
}
