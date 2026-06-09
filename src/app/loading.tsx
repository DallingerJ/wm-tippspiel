import Spinner from "@/components/Spinner";

export default function Loading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-gray-400">
      <Spinner className="h-8 w-8 text-blue-600" />
      <p className="text-sm font-medium">Lädt…</p>
    </div>
  );
}
