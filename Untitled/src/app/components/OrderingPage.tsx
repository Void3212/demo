import MobileOrdering from "../../imports/MobileOrdering";

interface OrderingPageProps {
  onNavigateToReservation: () => void;
}

export default function OrderingPage({ onNavigateToReservation }: OrderingPageProps) {
  return (
    <div className="relative transform transition-all duration-300 hover:scale-[1.02]">
      <MobileOrdering />
      
      {/* Interactive overlay for reservation */}
      <div className="absolute inset-0 pointer-events-none">
        <button
          onClick={onNavigateToReservation}
          className="absolute top-[20%] left-[10%] right-[10%] h-[15%] bg-transparent hover:bg-black/10 rounded-lg transition-all duration-200 pointer-events-auto cursor-pointer group"
        >
          <div className="w-full h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <span className="text-white font-bold text-lg bg-black/70 px-4 py-2 rounded animate-pulse">Reserve Now!</span>
          </div>
        </button>
      </div>
    </div>
  );
}
