import AdminSideWithCart from "../../imports/AdminSide-13-130";
import { type Product } from "../data/products";

interface DesktopOrderingWithCartProps {
  selectedProducts: Product[];
  onNavigateToReservation: () => void;
  onCloseCart: () => void;
}

const DESIGN_WIDTH = 1600;
const DESIGN_HEIGHT = 1052;
const RESERVATION_BANNER = { left: 605, top: 192, width: 899, height: 245 };
const CART_PANEL = { left: 131, top: 192, width: 457.364, height: 843 };

function isWithinZone(
  x: number,
  y: number,
  zone: { left: number; top: number; width: number; height: number },
) {
  return x >= zone.left && x <= zone.left + zone.width && y >= zone.top && y <= zone.top + zone.height;
}

function getCanvasCoordinates(e: React.MouseEvent<HTMLDivElement>) {
  const rect = e.currentTarget.getBoundingClientRect();
  const scaleX = DESIGN_WIDTH / rect.width;
  const scaleY = DESIGN_HEIGHT / rect.height;

  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  };
}

export default function DesktopOrderingWithCart({ selectedProducts, onNavigateToReservation, onCloseCart }: DesktopOrderingWithCartProps) {
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const { x, y } = getCanvasCoordinates(e);

    if (isWithinZone(x, y, RESERVATION_BANNER)) {
      onNavigateToReservation();
      return;
    }

    if (!isWithinZone(x, y, CART_PANEL)) {
      onCloseCart();
    }
  };

  return (
    <div className="w-[1600px] h-[1052px] relative" onClick={handleClick}>
      <AdminSideWithCart selectedProducts={selectedProducts} />
    </div>
  );
}
