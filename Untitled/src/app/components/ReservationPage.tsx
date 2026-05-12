import ReservationMobile from "../../imports/MobileOrdering-1-565";

interface ReservationPageProps {
  onNavigateBack: () => void;
}

export default function ReservationPage({ onNavigateBack }: ReservationPageProps) {
  return (
    <div className="relative">
      <ReservationMobile />
      {/* Back button overlay */}
      <div
        className="absolute left-[21px] top-[22px] w-[44px] h-[44px] cursor-pointer z-10"
        onClick={onNavigateBack}
        title="Back to ordering"
      />
    </div>
  );
}
