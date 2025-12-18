export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
      <div className="text-center" role="status" aria-label="Loading">
        <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-3 text-gray-600 text-sm">Loading...</p>
      </div>
    </div>
  );
}
