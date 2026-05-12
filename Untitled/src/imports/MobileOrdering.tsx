import { useState, useRef, useEffect } from 'react';import { type Product } from "../app/data/products";import { useProducts } from '../hooks/useProducts';import svgPaths from "./svg-bqj9wgvtth";
import imgShoppingCart1 from "figma:asset/70246941f1086280a283485a466f03ee58610e97.png";
import imgImage5 from "figma:asset/b521ae4a6207cfb461308caad9f953831d7824c9.png";
import imgToyFacesColoredBg81 from "figma:asset/1c103a1acc0b9825064a996efd2dc58920faabd3.png";
import imgChillinganHeader from "figma:asset/cc4233f9bd38641a5ac2903d4f8eb6294ec92106.png";
import imgRectangle7 from "figma:asset/a76334811a63b21fc5eabd96235b2ab8f1b863a0.png";

function Group2() {
  return (
    <div className="absolute contents left-[351px] top-[163px]">
      <div className="absolute bg-[#ff7a05] left-[351px] rounded-[20px] size-[60px] top-[163px]" />
      <div className="absolute left-[361px] size-[40px] top-[173px]" data-name="shopping cart 1">
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgShoppingCart1} />
      </div>
    </div>
  );
}

function Group3() {
  return (
    <div className="absolute contents left-[351px] top-[163px]">
      <Group2 />
    </div>
  );
}

const CATEGORY_LABELS = [
  "Sizzling Meal",
  "Rice Bowl Meal",
  "Grilled",
  "Drinks",
  "Appetizers",
  "Soup",
  "Pork",
  "Chicken",
  "Beef",
  "Seafood",
  "Vegetables",
  "Noodles/Pasta",
  "Rice",
  "Non-alcoholic Drinks",
  "Shakes",
  "Fresh Fruit Juice",
  "Other",
  "Alcoholic Drinks"
];

function MobileCategorySelector({ selectedCategory, onSelectCategory }: { selectedCategory: string; onSelectCategory: (cat: string) => void }) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
      setTimeout(checkScroll, 300);
    }
  };

  return (
    <div className="absolute h-[50px] left-[0px] top-[264px] w-[430px] flex items-center gap-2 px-2 z-50">
      {/* Left Scroll Button */}
      <button
        onClick={() => scroll("left")}
        disabled={!canScrollLeft}
        className={`flex-shrink-0 flex items-center justify-center w-[32px] h-[32px] rounded-full transition-all duration-200 ${
          canScrollLeft
            ? 'bg-[#ff7a05] text-white hover:bg-[#e66b00]'
            : 'bg-[#f0f0f0] text-[#999] cursor-not-allowed'
        }`}
      >
        <span>&lt;</span>
      </button>

      {/* Categories Container */}
      <div
        ref={scrollContainerRef}
        onScroll={checkScroll}
        className="flex-1 overflow-x-auto overflow-y-hidden scrollbar-none scroll-smooth"
      >
        <div className="flex gap-2 py-1 min-w-min">
          {CATEGORY_LABELS.map((label) => {
            const isActive = selectedCategory === label;
            return (
              <button
                key={label}
                type="button"
                onClick={() => onSelectCategory(label)}
                className={`flex-shrink-0 px-3 py-1 rounded-full font-['Inter:Medium',sans-serif] font-medium text-[12px] cursor-pointer transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? 'bg-[#ff7a05] text-white shadow-[0_4px_12px_rgba(255,122,5,0.3)]'
                    : 'bg-[#f3f4f6] text-[#6a6a6a] hover:bg-[#ffe4d9] hover:text-[#ff7a05]'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Scroll Button */}
      <button
        onClick={() => scroll("right")}
        disabled={!canScrollRight}
        className={`flex-shrink-0 flex items-center justify-center w-[32px] h-[32px] rounded-full transition-all duration-200 ${
          canScrollRight
            ? 'bg-[#ff7a05] text-white hover:bg-[#e66b00]'
            : 'bg-[#f0f0f0] text-[#999] cursor-not-allowed'
        }`}
      >
        <span>&gt;</span>
      </button>
    </div>
  );
}

function Frame3({ selectedCategory, setSelectedCategory }: { selectedCategory: string; setSelectedCategory: (cat: string) => void }) {
  return (
    <MobileCategorySelector selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />
  );
}

function Group9() {
  return (
    <div className="absolute contents left-[30px] top-[544px]">
      <div className="absolute left-[30px] overflow-clip size-[16px] top-[547px]" data-name="star">
        <div className="absolute inset-[0.5%_-0.26%_2.85%_-0.26%]" data-name="Vector">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16.0833 15.4627">
            <path d={svgPaths.p1d6a700} fill="var(--fill-0, #FF9633)" id="Vector" />
          </svg>
        </div>
      </div>
      <p className="absolute font-['Roboto:Medium',sans-serif] font-medium leading-[1.347] left-[51px] text-[#3c2f2f] text-[16px] top-[544px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        4.9
      </p>
    </div>
  );
}

function Group10() {
  return (
    <div className="absolute contents left-[19px] top-[355px]">
      <div className="absolute bg-white h-[225px] left-[19px] rounded-[20px] shadow-[0px_6px_17px_0px_rgba(0,0,0,0.13)] top-[355px] w-[185px]" />
      <div className="absolute left-[51px] size-[120px] top-[366px] cursor-pointer" data-name="image 5" onClick={() => alert('Added Chicken Tasty Lechon to cart')}>
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage5} />
      </div>
      <div className="absolute left-[169px] overflow-clip size-[24px] top-[541px]" data-name="heart">
        <div className="absolute inset-[7.71%_-0.06%_3.84%_-0.02%]" data-name="Vector">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24.0176 21.2281">
            <path d={svgPaths.pf387b00} fill="var(--fill-0, #3C2F2F)" id="Vector" />
          </svg>
        </div>
      </div>
      <div className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[0] left-[36px] not-italic text-[#3c2f2f] text-[0px] top-[493px] w-[117px] whitespace-pre-wrap">
        <p className="mb-0 text-[16px]">
          <span className="font-['Roboto:SemiBold',sans-serif] font-semibold leading-[1.347]" style={{ fontVariationSettings: "'wdth' 100" }}>
            Chicken
          </span>
          <span className="font-['Roboto:Regular',sans-serif] font-normal leading-[114.93333435058594%]" style={{ fontVariationSettings: "'wdth' 100" }}>{` `}</span>
        </p>
        <p className="font-['Roboto:Regular',sans-serif] font-normal leading-[1.347] text-[16px]" style={{ fontVariationSettings: "'wdth' 100" }}>
          Tasty Lechon
        </p>
      </div>
      <div className="absolute h-[11px] left-[66px] top-[464px] w-[91px]">
        <div className="absolute inset-[-100%_-12.09%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 113 33">
            <g filter="url(#filter0_f_1_239)" id="Ellipse 1">
              <ellipse cx="56.5" cy="16.5" fill="var(--fill-0, black)" rx="45.5" ry="5.5" />
            </g>
            <defs>
              <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="33" id="filter0_f_1_239" width="113" x="0" y="0">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" />
                <feGaussianBlur result="effect1_foregroundBlur_1_239" stdDeviation="5.5" />
              </filter>
            </defs>
          </svg>
        </div>
      </div>
      <Group9 />
    </div>
  );
}

function Group12() {
  return (
    <div className="absolute contents left-[237px] top-[544px]">
      <div className="absolute left-[237px] overflow-clip size-[16px] top-[547px]" data-name="star">
        <div className="absolute inset-[0.5%_-0.26%_2.85%_-0.26%]" data-name="Vector">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16.0833 15.4627">
            <path d={svgPaths.p1d6a700} fill="var(--fill-0, #FF9633)" id="Vector" />
          </svg>
        </div>
      </div>
      <p className="absolute font-['Roboto:Medium',sans-serif] font-medium leading-[1.347] left-[258px] text-[#3c2f2f] text-[16px] top-[544px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        4.8
      </p>
    </div>
  );
}

function Group11() {
  return (
    <div className="absolute contents left-[226px] top-[355px]">
      <div className="absolute bg-white h-[225px] left-[226px] rounded-[20px] shadow-[0px_6px_17px_0px_rgba(0,0,0,0.13)] top-[355px] w-[185px]" />
      <div className="absolute left-[376px] overflow-clip size-[24px] top-[541px]" data-name="heart">
        <div className="absolute inset-[7.71%_-0.06%_3.84%_-0.02%]" data-name="Vector">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24.0176 21.2281">
            <path d={svgPaths.pf387b00} fill="var(--fill-0, #3C2F2F)" id="Vector" />
          </svg>
        </div>
      </div>
      <div className="absolute h-[11px] left-[273px] top-[465px] w-[91px]">
        <div className="absolute inset-[-100%_-12.09%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 113 33">
            <g filter="url(#filter0_f_1_239)" id="Ellipse 1">
              <ellipse cx="56.5" cy="16.5" fill="var(--fill-0, black)" rx="45.5" ry="5.5" />
            </g>
            <defs>
              <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="33" id="filter0_f_1_239" width="113" x="0" y="0">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" />
                <feGaussianBlur result="effect1_foregroundBlur_1_239" stdDeviation="5.5" />
              </filter>
            </defs>
          </svg>
        </div>
      </div>
      <div className="absolute left-[258px] size-[120px] top-[366px] cursor-pointer" data-name="image 5" onClick={() => alert('Added item to cart')}>
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage5} />
      </div>
      <Group12 />
    </div>
  );
}

function Group15() {
  return (
    <div className="absolute contents left-[30px] top-[800px]">
      <div className="absolute left-[30px] overflow-clip size-[16px] top-[803px]" data-name="star">
        <div className="absolute inset-[0.5%_-0.26%_2.85%_-0.26%]" data-name="Vector">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16.0833 15.4627">
            <path d={svgPaths.p1d6a700} fill="var(--fill-0, #FF9633)" id="Vector" />
          </svg>
        </div>
      </div>
      <p className="absolute font-['Roboto:Medium',sans-serif] font-medium leading-[1.347] left-[51px] text-[#3c2f2f] text-[16px] top-[800px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        4.6
      </p>
    </div>
  );
}

function Group13() {
  return (
    <div className="absolute contents left-[19px] top-[611px]">
      <div className="absolute bg-white h-[225px] left-[19px] rounded-[20px] shadow-[0px_6px_17px_0px_rgba(0,0,0,0.13)] top-[611px] w-[185px]" />
      <div className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[0] left-[36px] not-italic text-[#3c2f2f] text-[0px] top-[749px] w-[117px] whitespace-pre-wrap">
        <p className="mb-0 text-[16px]">
          <span className="font-['Roboto:SemiBold',sans-serif] font-semibold leading-[1.347]" style={{ fontVariationSettings: "'wdth' 100" }}>
            Chicken
          </span>
          <span className="font-['Roboto:Regular',sans-serif] font-normal leading-[114.93333435058594%]" style={{ fontVariationSettings: "'wdth' 100" }}>{` `}</span>
        </p>
        <p className="font-['Roboto:Regular',sans-serif] font-normal leading-[1.347] text-[16px]" style={{ fontVariationSettings: "'wdth' 100" }}>
          Tasty Lechon
        </p>
      </div>
      <div className="absolute left-[169px] overflow-clip size-[24px] top-[797px]" data-name="heart">
        <div className="absolute inset-[7.71%_-0.06%_3.84%_-0.02%]" data-name="Vector">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24.0176 21.2281">
            <path d={svgPaths.pf387b00} fill="var(--fill-0, #3C2F2F)" id="Vector" />
          </svg>
        </div>
      </div>
      <div className="absolute h-[15.761px] left-[59px] top-[718.24px] w-[110px]">
        <div className="absolute inset-[-69.79%_-10%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 132 37.7609">
            <g filter="url(#filter0_f_1_243)" id="Ellipse 1">
              <path d={svgPaths.p29feceb0} fill="var(--fill-0, black)" />
            </g>
            <defs>
              <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="37.7609" id="filter0_f_1_243" width="132" x="0" y="2.19104e-08">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" />
                <feGaussianBlur result="effect1_foregroundBlur_1_243" stdDeviation="5.5" />
              </filter>
            </defs>
          </svg>
        </div>
      </div>
      <Group15 />
      <div className="absolute left-[51px] size-[120px] top-[622px]" data-name="image 5">
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage5} />
      </div>
    </div>
  );
}

function Group17() {
  return (
    <div className="absolute contents left-[237px] top-[800px]">
      <div className="absolute left-[237px] overflow-clip size-[16px] top-[803px]" data-name="star">
        <div className="absolute inset-[0.5%_-0.26%_2.85%_-0.26%]" data-name="Vector">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16.0833 15.4627">
            <path d={svgPaths.p1d6a700} fill="var(--fill-0, #FF9633)" id="Vector" />
          </svg>
        </div>
      </div>
      <p className="absolute font-['Roboto:Medium',sans-serif] font-medium leading-[1.347] left-[258px] text-[#3c2f2f] text-[16px] top-[800px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        4.5
      </p>
    </div>
  );
}

function Group16() {
  return (
    <div className="absolute contents left-[226px] top-[611px]">
      <div className="absolute bg-white h-[225px] left-[226px] rounded-[20px] shadow-[0px_6px_17px_0px_rgba(0,0,0,0.13)] top-[611px] w-[185px]" />
      <div className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[0] left-[243px] not-italic text-[#3c2f2f] text-[0px] top-[749px] w-[117px] whitespace-pre-wrap">
        <p className="mb-0 text-[16px]">
          <span className="font-['Roboto:SemiBold',sans-serif] font-semibold leading-[1.347]" style={{ fontVariationSettings: "'wdth' 100" }}>
            Chicken
          </span>
          <span className="font-['Roboto:Regular',sans-serif] font-normal leading-[114.93333435058594%]" style={{ fontVariationSettings: "'wdth' 100" }}>{` `}</span>
        </p>
        <p className="font-['Roboto:Regular',sans-serif] font-normal leading-[1.347] text-[16px]" style={{ fontVariationSettings: "'wdth' 100" }}>
          Tasty Lechon
        </p>
      </div>
      <div className="absolute left-[376px] overflow-clip size-[24px] top-[797px]" data-name="heart">
        <div className="absolute inset-[7.71%_-0.06%_3.84%_-0.02%]" data-name="Vector">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24.0176 21.2281">
            <path d={svgPaths.pf387b00} fill="var(--fill-0, #3C2F2F)" id="Vector" />
          </svg>
        </div>
      </div>
      <div className="absolute h-[11px] left-[266.5px] top-[720.99px] w-[112px]">
        <div className="absolute inset-[-100%_-9.82%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 134 33">
            <g filter="url(#filter0_f_1_241)" id="Ellipse 1">
              <path d={svgPaths.p3ba4bf80} fill="var(--fill-0, black)" />
            </g>
            <defs>
              <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="33" id="filter0_f_1_241" width="134" x="0" y="0">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" />
                <feGaussianBlur result="effect1_foregroundBlur_1_241" stdDeviation="5.5" />
              </filter>
            </defs>
          </svg>
        </div>
      </div>
      <Group17 />
      <div className="absolute h-[27px] left-[375.82px] top-[711.5px] w-[26.679px]">
        <div className="absolute inset-[-33.33%_-33.73%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 44.6794 45">
            <g filter="url(#filter0_f_1_251)" id="Ellipse 2">
              <path d={svgPaths.p38d3c200} fill="var(--fill-0, white)" />
            </g>
            <defs>
              <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="45" id="filter0_f_1_251" width="44.6794" x="-9.73434e-09" y="0">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" />
                <feGaussianBlur result="effect1_foregroundBlur_1_251" stdDeviation="4.5" />
              </filter>
            </defs>
          </svg>
        </div>
      </div>
      <div className="absolute left-[258px] size-[120px] top-[622px]" data-name="image 5">
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage5} />
      </div>
    </div>
  );
}

function Group14() {
  return (
    <div className="absolute contents left-[19px] top-[355px]">
      <Group10 />
      <Group11 />
      <Group13 />
      <Group16 />
    </div>
  );
}

function Group18() {
  return (
    <div className="absolute h-[90px] left-[-19px] top-[856px] w-[456px]">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 456 90">
        <g id="Group 16">
          <path d={svgPaths.p2f13e300} fill="var(--fill-0, #FF7A05)" id="Subtract" />
        </g>
      </svg>
    </div>
  );
}

function Group() {
  return (
    <div className="absolute inset-[0.01%_0_0_0]" data-name="Group">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 23.9999">
        <g id="Group">
          <path d={svgPaths.p1d168600} fill="var(--fill-0, white)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Group1() {
  return (
    <div className="absolute inset-[0_16.67%]" data-name="Group">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16.0007 24.0008">
        <g id="Group">
          <path d={svgPaths.p39705400} fill="var(--fill-0, white)" id="Vector" />
          <path d={svgPaths.p2454a700} fill="var(--fill-0, white)" id="Vector_2" />
        </g>
      </svg>
    </div>
  );
}

function Group19() {
  return (
    <div className="absolute left-[179px] size-[72px] top-[808px]">
      <div className="absolute inset-[-22.22%_-29.17%_-36.11%_-29.17%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 114 114">
          <g id="Group 18">
            <g filter="url(#filter0_d_1_205)" id="Ellipse 7">
              <circle cx="57" cy="52" fill="var(--fill-0, #FF7A05)" r="36" />
            </g>
            <g id="Group 17">
              <path d="M49 52H65" id="Line 1" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeWidth="5" />
              <path d="M57 60V44" id="Line 2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeWidth="5" />
            </g>
          </g>
          <defs>
            <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="114" id="filter0_d_1_205" width="114" x="0" y="0">
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
              <feMorphology in="SourceAlpha" operator="dilate" radius="5" result="effect1_dropShadow_1_205" />
              <feOffset dy="5" />
              <feGaussianBlur stdDeviation="8" />
              <feComposite in2="hardAlpha" operator="out" />
              <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.4 0" />
              <feBlend in2="BackgroundImageFix" mode="normal" result="effect1_dropShadow_1_205" />
              <feBlend in="SourceGraphic" in2="effect1_dropShadow_1_205" mode="normal" result="shape" />
            </filter>
          </defs>
        </svg>
      </div>
    </div>
  );
}

function Frame({ searchQuery, setSearchQuery }: { searchQuery: string; setSearchQuery: (q: string) => void }) {
  return (
    <div className="content-stretch flex items-center relative shrink-0">
      <div className="h-[40px] relative rounded-[40px] shrink-0 w-[181px]" data-name="searchBox">
        <div className="overflow-clip relative rounded-[inherit] size-full">
          <div className="-translate-y-1/2 absolute left-[8px] overflow-clip size-[24px] top-1/2" data-name="icon/search">
            <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
              <g id="Vector" />
            </svg>
            <div className="absolute inset-[12.5%_29.17%_29.17%_12.5%]" data-name="Vector">
              <div className="absolute inset-[-5.36%]">
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15.5 15.5">
                  <path d={svgPaths.p30ddac70} id="Vector" stroke="var(--stroke-0, #6E6E6E)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                </svg>
              </div>
            </div>
            <div className="absolute inset-[62.5%_12.5%_12.5%_62.5%]" data-name="Vector">
              <div className="absolute inset-[-12.5%]">
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 7.5 7.5">
                  <path d="M6.75 6.75L0.75 0.75" id="Vector" stroke="var(--stroke-0, #6E6E6E)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                </svg>
              </div>
            </div>
          </div>
          <input
            type="text"
            placeholder="Search everything"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="absolute font-['SF_Pro_Display:Regular',sans-serif] leading-[normal] left-[48px] not-italic text-[#8e8e8e] text-[14px] top-[calc(50%-9px)] bg-transparent border-none outline-none w-[calc(100%-56px)]"
          />
        </div>
        <div aria-hidden="true" className="absolute border border-[#f5f5f5] border-solid inset-0 pointer-events-none rounded-[40px]" />
      </div>
    </div>
  );
}

function Frame1({ searchQuery, setSearchQuery }: { searchQuery: string; setSearchQuery: (q: string) => void }) {
  return (
    <div className="absolute bg-[#fff3f3] content-stretch flex gap-[24px] h-[58px] items-center left-[16px] top-[164px] w-[323px]">
      <Frame searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <div className="flex h-[30px] items-center justify-center relative shrink-0 w-0" style={{ "--transform-inner-width": "1185", "--transform-inner-height": "21" } as React.CSSProperties}>
        <div className="flex-none rotate-90">
          <div className="h-0 relative w-[30px]">
            <div className="absolute inset-[-1px_0_0_0]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 30 1">
                <line id="Line 2" stroke="var(--stroke-0, #DDDDDD)" x2="30" y1="0.5" y2="0.5" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-[#f63131] relative rounded-[40px] shrink-0 size-[40px]" data-name="Avatar">
        <div className="overflow-clip relative rounded-[inherit] size-full">
          <div className="absolute left-0 size-[40px] top-0" data-name="ToyFaces_Colored_BG_8 1">
            <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgToyFacesColoredBg81} />
          </div>
        </div>
        <div aria-hidden="true" className="absolute border border-[#f5f5f5] border-solid inset-0 pointer-events-none rounded-[40px]" />
      </div>
    </div>
  );
}

function Group8() {
  return (
    <div className="absolute h-[3.592px] left-[280.61px] top-[122.82px] w-[9.879px]">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 9.87863 3.59184">
        <g id="Group 1">
          <ellipse cx="1.23471" cy="1.79592" fill="var(--fill-0, white)" id="Ellipse 1" rx="1.23471" ry="1.79592" />
          <ellipse cx="4.93877" cy="1.79592" fill="var(--fill-0, #D5D0D0)" id="Ellipse 2" rx="1.23471" ry="1.79592" />
          <ellipse cx="8.64393" cy="1.79592" fill="var(--fill-0, #D4D0D0)" id="Ellipse 3" rx="1.23471" ry="1.79592" />
        </g>
      </svg>
    </div>
  );
}

const MOBILE_CARD_POSITIONS = [
  { left: 19, top: 355 },
  { left: 226, top: 355 },
  { left: 19, top: 611 },
  { left: 226, top: 611 },
];

function ProductCard({ product, left, top }: { product: Product; left: number; top: number }) {
  return (
    <div className="absolute w-[185px]" style={{ left, top }}>
      <div className="absolute inset-0 rounded-[20px] bg-white shadow-[0px_6px_17px_0px_rgba(0,0,0,0.13)]" />
      <div className="absolute left-[14px] top-[14px] h-[120px] w-[157px] overflow-hidden rounded-[20px]">
        <img alt={product.name} className="h-full w-full object-cover" src={product.imageUrl} />
      </div>
      <div className="absolute left-[14px] top-[144px] right-[14px]">
        <p className="font-['Inter:Medium',sans-serif] text-[15px] font-semibold text-[#3c2f2f]">{product.name}</p>
        <p className="mt-[6px] h-[34px] overflow-hidden text-[12px] leading-[1.4] text-[#6a6a6a]">{product.description}</p>
        <p className="mt-[8px] text-[14px] font-semibold text-[#ff7a05]">₱{product.price.toFixed(2)}</p>
      </div>
      <button
        type="button"
        onClick={() => alert(`Added ${product.name} to cart`)}
        className="absolute left-[14px] right-[14px] bottom-[14px] h-[34px] rounded-[16px] bg-[#ff7a05] text-[13px] font-semibold text-white"
      >
        Add to cart
      </button>
    </div>
  );
}

function Group20() {
  return (
    <div className="absolute contents left-[189px] top-[42px]">
      <div className="absolute flex h-[88px] items-center justify-center left-[189px] top-[42px] w-[222px]">
        <div className="-scale-y-100 flex-none rotate-180">
          <div className="h-[88px] relative rounded-[20px] w-[222px]">
            <div aria-hidden="true" className="absolute inset-0 pointer-events-none rounded-[20px]">
              <div className="absolute bg-[#d9d9d9] inset-0 rounded-[20px]" />
              <div className="absolute inset-0 overflow-hidden rounded-[20px]">
                <img alt="" className="absolute h-[559.67%] left-[-1.72%] max-w-none top-[-325.25%] w-[101.68%]" src={imgRectangle7} />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute h-[88px] left-[199.04px] top-[42px] w-[97.055px]">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 97.0553 88">
          <path d={svgPaths.p2d84a140} fill="var(--fill-0, #FF7A05)" id="Rectangle 9" opacity="0.85" />
        </svg>
      </div>
      <div className="absolute h-[88px] left-[189px] top-[42px] w-[90.362px]">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 90.3618 88">
          <path d={svgPaths.p1c310880} fill="var(--fill-0, #F94B4B)" id="Rectangle 8" opacity="0.85" />
        </svg>
      </div>
      <Group8 />
      <p className="absolute font-['DM_Sans:Bold',sans-serif] font-bold h-[16.709px] leading-[normal] left-[226px] text-[8px] text-white top-[90px] w-[35.698px]" style={{ fontVariationSettings: "'opsz' 14" }}>
        Now!
      </p>
      <p className="absolute font-['DM_Sans:Bold',sans-serif] font-bold h-[18.937px] leading-[normal] left-[209px] text-[9px] text-black top-[77px] w-[44.623px]" style={{ fontVariationSettings: "'opsz' 14" }}>
        Reserve
      </p>
    </div>
  );
}

function Home({ searchQuery, setSearchQuery, selectedCategory, setSelectedCategory, products }: { searchQuery: string; setSearchQuery: (q: string) => void; selectedCategory: string; setSelectedCategory: (cat: string) => void; products: Product[] }) {
  return (
    <div className="absolute bg-[#f1e6d2] h-[932px] left-0 overflow-clip rounded-[35px] top-0 w-[430px]" data-name="home">
      <Group3 />
      <Frame3 selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} />
      <div className="absolute left-0 top-0">
        {products
          .filter((product) => product.visible !== false)
          .filter((product) =>
            product.category === selectedCategory &&
            (product.name.toLowerCase().includes(searchQuery.toLowerCase()) || product.description.toLowerCase().includes(searchQuery.toLowerCase()))
          )
          .slice(0, 4)
          .map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              left={MOBILE_CARD_POSITIONS[index].left}
              top={MOBILE_CARD_POSITIONS[index].top}
            />
          ))}
      </div>
      <Group18 />
      <div className="absolute left-[376px] overflow-clip size-[24px] top-[873px]" data-name="heart">
        <div className="absolute inset-[7.99%_-0.02%_4.11%_-0.02%]" data-name="Vector">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24.0097 21.096">
            <path d={svgPaths.p1a40900} fill="var(--fill-0, white)" id="Vector" />
          </svg>
        </div>
      </div>
      <div className="absolute left-[31px] overflow-clip size-[24px] top-[873px]" data-name="home">
        <Group />
      </div>
      <div className="absolute left-[113px] overflow-clip size-[24px] top-[873px]" data-name="user">
        <Group1 />
      </div>
      <div className="absolute left-[294px] overflow-clip size-[24px] top-[873px]" data-name="comment">
        <div className="absolute inset-[-0.09%_0_0_0]" data-name="Vector">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 23.999 24.022">
            <path d={svgPaths.p1383c840} fill="var(--fill-0, white)" id="Vector" />
          </svg>
        </div>
        <div className="absolute inset-[33.33%_41.67%_54.17%_33.33%]" data-name="Vector">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 3">
            <path d={svgPaths.p14afb4f0} fill="var(--fill-0, white)" id="Vector" />
          </svg>
        </div>
        <div className="absolute bottom-[33.33%] left-[33.33%] right-1/4 top-[54.17%]" data-name="Vector">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 3">
            <path d={svgPaths.p20f5d080} fill="var(--fill-0, white)" id="Vector" />
          </svg>
        </div>
      </div>
      <div className="absolute left-[41px] size-[4px] top-[905px]">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 4 4">
          <circle cx="2" cy="2" fill="var(--fill-0, white)" id="Ellipse 6" r="2" />
        </svg>
      </div>
      <Frame1 searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <div className="absolute h-[132px] left-[9px] top-[24px] w-[198px]" data-name="Chillingan Header">
        <img alt="" className="absolute inset-0 max-w-none mix-blend-darken object-cover pointer-events-none size-full" src={imgChillinganHeader} />
      </div>
      <Group20 />
    </div>
  );
}

export default function MobileOrdering() {
  const [selectedCategory, setSelectedCategory] = useState('Sizzling Meal');
  const [searchQuery, setSearchQuery] = useState('');
  const { products, loading } = useProducts({ autoFetch: true });

  return (
    <div className="relative size-full" data-name="Mobile Ordering">
      <Home searchQuery={searchQuery} setSearchQuery={setSearchQuery} selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} products={products} />
      {loading && (
        <div className="absolute inset-0 bg-black/20 rounded-[35px] flex items-center justify-center">
          <div className="text-white text-sm">Loading menu...</div>
        </div>
      )}
      <div className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[0] left-[250px] not-italic text-[#3c2f2f] text-[0px] top-[488px] w-[117px] whitespace-pre-wrap">
        <p className="mb-0 text-[16px]">
          <span className="font-['Roboto:SemiBold',sans-serif] font-semibold leading-[1.347]" style={{ fontVariationSettings: "'wdth' 100" }}>
            Chicken
          </span>
          <span className="font-['Roboto:Regular',sans-serif] font-normal leading-[114.93333435058594%]" style={{ fontVariationSettings: "'wdth' 100" }}>{` `}</span>
        </p>
        <p className="font-['Roboto:Regular',sans-serif] font-normal leading-[1.347] text-[16px]" style={{ fontVariationSettings: "'wdth' 100" }}>
          Tasty Lechon
        </p>
      </div>
    </div>
  );
}