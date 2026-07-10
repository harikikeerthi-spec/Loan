export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fcfaff] p-10">
      <div className="w-16 h-16 border-4 border-purple-200 border-t-[#6605c7] rounded-full animate-spin mb-6" />
      <h2 className="text-2xl font-display font-bold text-gray-900 mb-2" style={{ fontFamily: "'Noto Serif', 'Playfair Display', serif" }}>Finding University Profile...</h2>
      <p className="text-gray-500 font-medium">Gathering official data and rankings from AI...</p>
    </div>
  );
}
