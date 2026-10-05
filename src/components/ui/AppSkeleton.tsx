export default function AppSkeleton() {
  return (
    <div className="p-6 space-y-4" aria-busy="true" aria-label="Loading">
      <div className="skeleton h-8 w-1/2" />
      <div className="skeleton h-4 w-full" />
      <div className="skeleton h-4 w-11/12" />
      <div className="skeleton h-4 w-4/5" />
      <div className="skeleton h-32 w-full mt-6" />
    </div>
  );
}
