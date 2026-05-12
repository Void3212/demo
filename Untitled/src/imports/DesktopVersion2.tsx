import { useState } from "react";
import svgPaths from "./svg-xu7ltsapcx";
import imgRectangle7 from "figma:asset/4cdcdcf3f7d198a3839df7aed562de7828a7fc03.png";
import imgRectangle12 from "figma:asset/fe3f9cd6a203285a0d8cc412a982ed6efe754a3f.png";
import imgChillinganHeader from "figma:asset/cc4233f9bd38641a5ac2903d4f8eb6294ec92106.png";

type ReservationCategory = "Billiard" | "Karaoke" | "Darts" | "Basketball" | "Function Room";


function Group3() {
  return (
    <div className="absolute contents left-0 top-0">
      <div className="absolute bg-[rgba(255,122,5,0.97)] h-[1052px] left-0 top-0 w-[118px]" />
      <div className="absolute bg-[#bfa643] h-[62px] left-[108px] top-[395px] w-[10px]" />
    </div>
  );
}

function Group2() {
  return (
    <div className="absolute h-[245px] left-[641px] top-[47px] w-[433.5px]">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 433.5 245">
        <g id="Group 2">
          <path d={svgPaths.p14c1a940} fill="var(--fill-0, #FF9500)" id="Rectangle 9" opacity="0.85" />
          <path d={svgPaths.p22cd400} fill="var(--fill-0, #F94B4B)" id="Rectangle 8" opacity="0.85" />
          <g id="Group 1">
            <circle cx="376" cy="230" fill="var(--fill-0, white)" id="Ellipse 1" r="5" />
            <circle cx="391" cy="230" fill="var(--fill-0, #D5D0D0)" id="Ellipse 2" r="5" />
            <circle cx="406" cy="230" fill="var(--fill-0, #D4D0D0)" id="Ellipse 3" r="5" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function Group() {
  return (
    <div className="absolute inset-[0.01%_0_0_0]" data-name="Group">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 45 44.9998">
        <g id="Group">
          <path d={svgPaths.p2dcd6e00} fill="var(--fill-0, white)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Group1() {
  return (
    <div className="absolute inset-[0_16.67%]" data-name="Group">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 30.0013 45.0014">
        <g id="Group">
          <path d={svgPaths.p150d9600} fill="var(--fill-0, white)" id="Vector" />
          <path d={svgPaths.p22e48a80} fill="var(--fill-0, white)" id="Vector_2" />
        </g>
      </svg>
    </div>
  );
}

export default function DesktopVersion({
  onReserve,
  onCategorySelect,
}: {
  onReserve?: (category: ReservationCategory) => void;
  onCategorySelect?: (category: ReservationCategory) => void;
} = {}) {
  const [selectedCategory, setSelectedCategory] = useState<ReservationCategory | null>(null);

  const handleCategoryClick = (category: ReservationCategory) => {
    setSelectedCategory(category);
    onCategorySelect?.(category);
  };

  const handleReserveClick = (category: ReservationCategory) => {
    onReserve?.(category);
  };

  return (
    <div className="bg-[#f1e6d2] relative size-full" data-name="DESKTOP VERSION 2">
      <Group3 />
      <p
        className="absolute font-['DM_Sans:Regular',sans-serif] font-normal leading-[normal] left-[277px] text-[24px] text-black top-[317px] whitespace-nowrap cursor-pointer hover:text-[#d51d1d] transition-colors"
        onClick={() => handleCategoryClick("Billiard")}
        style={{ fontVariationSettings: "'opsz' 14" }}
      >
        Billiard
      </p>
      <p
        className="absolute font-['DM_Sans:Regular',sans-serif] font-normal leading-[normal] left-[453px] text-[24px] text-black top-[317px] whitespace-nowrap cursor-pointer hover:text-[#d51d1d] transition-colors"
        onClick={() => handleCategoryClick("Function Room")}
        style={{ fontVariationSettings: "'opsz' 14" }}
      >
        Function Room
      </p>
      <p
        className="absolute font-['DM_Sans:Regular',sans-serif] font-normal leading-[normal] left-[721px] text-[24px] text-black top-[316px] whitespace-nowrap cursor-pointer hover:text-[#d51d1d] transition-colors"
        onClick={() => handleCategoryClick("Darts")}
        style={{ fontVariationSettings: "'opsz' 14" }}
      >
        Darts
      </p>
      <p
        className="absolute font-['DM_Sans:Regular',sans-serif] font-normal leading-[normal] left-[876px] text-[24px] text-black top-[317px] whitespace-nowrap cursor-pointer hover:text-[#d51d1d] transition-colors"
        onClick={() => handleCategoryClick("Basketball")}
        style={{ fontVariationSettings: "'opsz' 14" }}
      >
        Basketball Arcade
      </p>
      <p
        className="absolute font-['DM_Sans:Regular',sans-serif] font-normal leading-[normal] left-[1174px] text-[24px] text-black top-[317px] w-[121px] cursor-pointer hover:text-[#d51d1d] transition-colors"
        onClick={() => handleCategoryClick("Karaoke")}
        style={{ fontVariationSettings: "'opsz' 14" }}
      >
        Karaoke
      </p>
      <p className="absolute font-['DM_Sans:Regular',sans-serif] font-normal leading-[normal] left-[1399px] text-[24px] text-black top-[317px] whitespace-nowrap" style={{ fontVariationSettings: "'opsz' 14" }}>
        All
      </p>
      <div className="absolute inset-[30.61%_55.93%_67.61%_42.53%]" data-name="concierge-bell">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 25 18.75">
          <path d={svgPaths.p3906900} fill="var(--fill-0, #D51D1D)" id="concierge-bell" />
        </svg>
      </div>
      <div className="absolute flex h-[245px] items-center justify-center left-[641px] top-[47px] w-[899px]">
        <div className="-scale-y-100 flex-none rotate-180">
          <div className="h-[245px] relative rounded-[20px] w-[899px]">
            <div aria-hidden="true" className="absolute inset-0 pointer-events-none rounded-[20px]">
              <div className="absolute bg-[#d9d9d9] inset-0 rounded-[20px]" />
              <div className="absolute inset-0 overflow-hidden rounded-[20px]">
                <img alt="" className="absolute h-[297.48%] left-[-18.33%] max-w-none top-[-176.64%] w-[121.65%]" src={imgRectangle7} />
              </div>
            </div>
          </div>
        </div>
      </div>
      <Group2 />
      <p className="absolute font-['DM_Sans:Bold',sans-serif] font-bold leading-[normal] left-[781px] text-[36px] text-white top-[184px] whitespace-nowrap" style={{ fontVariationSettings: "'opsz' 14" }}>
        Online!
      </p>
      <p className="absolute font-['DM_Sans:Bold',sans-serif] font-bold leading-[normal] left-[683px] text-[40px] text-black top-[127px] whitespace-nowrap" style={{ fontVariationSettings: "'opsz' 14" }}>
        You can order
      </p>
      <div className="absolute flex h-[5px] items-center justify-center left-[248px] top-[365px] w-[1272px]">
        <div className="-scale-y-100 flex-none">
          <div className="bg-[#d9d9d9] h-[5px] w-[1272px]" />
        </div>
      </div>
      <div className="absolute bg-[#d51d1d] h-[9px] left-[1322px] top-[365px] w-[198px]" />
      <div className="absolute inset-[30.51%_83.53%_67.11%_15.31%]" data-name="Vector">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18.75 25">
          <path d={svgPaths.p2c3e9580} fill="var(--fill-0, #D51D1D)" id="Vector" />
        </svg>
      </div>
      <div className="absolute inset-[30.32%_46.25%_67.3%_52.59%]" data-name="Award Icon">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18.7502 25.0005">
          <path d={svgPaths.pd809980} fill="var(--fill-0, #D51D1D)" id="Award Icon" />
        </svg>
      </div>
      <div className="absolute inset-[30.42%_27.58%_67.47%_70.99%]" data-name="Star Icon">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 23.2205 22.225">
          <path d={svgPaths.p236e2100} fill="var(--fill-0, #D51D1D)" id="Star Icon" />
        </svg>
      </div>
      <div className="absolute inset-[30.51%_14.14%_67.41%_84.32%]" data-name="Vector">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 25 21.875">
          <path d={svgPaths.p387fbdc0} fill="var(--fill-0, #D51D1D)" id="Vector" />
        </svg>
      </div>
      <div className="absolute inset-[30.42%_72.66%_67.5%_25.99%]" data-name="Vector">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 21.875 21.875">
          <path d={svgPaths.p1a136e00} fill="var(--fill-0, #D51D1D)" id="Vector" />
        </svg>
      </div>
      <div className="absolute h-[190px] left-[324px] rounded-[20px] top-[398px] w-[307px]">
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none rounded-[20px]">
          <div className="absolute bg-[#d9d9d9] inset-0 rounded-[20px]" />
          <img alt="" className="absolute max-w-none object-cover rounded-[20px] size-full" src={imgRectangle12} />
        </div>
      </div>
      <p className="absolute font-['DM_Sans:Medium',sans-serif] font-medium h-[38px] leading-[normal] left-[339px] text-[24px] text-black top-[609px] w-[88px]" style={{ fontVariationSettings: "'opsz' 14" }}>
        Billiard
      </p>
      <p className="absolute font-['DM_Sans:Medium',sans-serif] font-medium h-[32px] leading-[normal] left-[338px] text-[#797575] text-[20px] top-[655px] w-[87px]" style={{ fontVariationSettings: "'opsz' 14" }}>
        4 tables
      </p>
      <div className="absolute left-[34px] overflow-clip size-[45px] top-[653px]" data-name="heart">
        <div className="absolute inset-[7.99%_-0.02%_4.11%_-0.02%]" data-name="Vector">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 45.0182 39.555">
            <path d={svgPaths.p3de2ea00} fill="var(--fill-0, white)" id="Vector" />
          </svg>
        </div>
      </div>
      <div className="absolute left-[34px] overflow-clip size-[45px] top-[399px]" data-name="home">
        <Group />
      </div>
      <div className="absolute left-[34px] overflow-clip size-[45px] top-[526px]" data-name="user">
        <Group1 />
      </div>
      <div className="absolute left-[34px] overflow-clip size-[45px] top-[272px]" data-name="comment">
        <div className="absolute inset-[-0.09%_0_0_0]" data-name="Vector">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 44.9981 45.0413">
            <path d={svgPaths.p21db3ec0} fill="var(--fill-0, white)" id="Vector" />
          </svg>
        </div>
        <div className="absolute inset-[33.33%_41.67%_54.17%_33.33%]" data-name="Vector">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11.25 5.625">
            <path d={svgPaths.p56cac70} fill="var(--fill-0, white)" id="Vector" />
          </svg>
        </div>
        <div className="absolute bottom-[33.33%] left-[33.33%] right-1/4 top-[54.17%]" data-name="Vector">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18.75 5.625">
            <path d={svgPaths.p1b45d800} fill="var(--fill-0, white)" id="Vector" />
          </svg>
        </div>
      </div>
      <div className="absolute h-[368px] left-[99px] top-[-51px] w-[552px]" data-name="Chillingan Header">
        <img alt="" className="absolute inset-0 max-w-none mix-blend-darken object-cover pointer-events-none size-full" src={imgChillinganHeader} />
      </div>
      <p className="absolute font-['Alegreya:Bold',sans-serif] font-bold h-[55px] leading-[normal] left-[202px] text-[#0a376e] text-[30px] top-[239px] w-[380px]">RESERVATION SCHEDULE</p>
      <div className="absolute bg-[#ff7a05] h-[40px] left-[476px] rounded-[10px] top-[639px] w-[143px] cursor-pointer hover:bg-[#ff8f1a] transition-colors" onClick={() => handleReserveClick("Billiard")} />
      <button
        onClick={() => handleReserveClick("Billiard")}
        className="absolute font-['DM_Sans:Bold',sans-serif] font-bold h-[32px] leading-[normal] left-[503px] text-[20px] text-white top-[647px] w-[89px] cursor-pointer hover:opacity-80 transition-opacity border-none bg-transparent"
        style={{ fontVariationSettings: "'opsz' 14" }}
      >
        Reserve
      </button>
      <div className="absolute h-[190px] left-[723px] rounded-[20px] top-[398px] w-[306px]">
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none rounded-[20px]">
          <div className="absolute bg-[#d9d9d9] inset-0 rounded-[20px]" />
          <img alt="" className="absolute max-w-none object-cover rounded-[20px] size-full" src={imgRectangle12} />
        </div>
      </div>
      <p className="absolute font-['DM_Sans:Medium',sans-serif] font-medium h-[38px] leading-[normal] left-[738px] text-[24px] text-black top-[609px] w-[103px]" style={{ fontVariationSettings: "'opsz' 14" }}>
        Karaoke
      </p>
      <p className="absolute font-['DM_Sans:Medium',sans-serif] font-medium h-[32px] leading-[normal] left-[737px] text-[#797575] text-[20px] top-[655px] w-[125px]" style={{ fontVariationSettings: "'opsz' 14" }}>
        3 machines
      </p>
      <div className="absolute bg-[#ff7a05] h-[40px] left-[875px] rounded-[10px] top-[639px] w-[143px] cursor-pointer hover:bg-[#ff8f1a] transition-colors" onClick={() => handleReserveClick("Karaoke")} />
      <button
        onClick={() => handleReserveClick("Karaoke")}
        className="absolute font-['DM_Sans:Bold',sans-serif] font-bold h-[32px] leading-[normal] left-[901px] text-[20px] text-white top-[647px] w-[90px] cursor-pointer hover:opacity-80 transition-opacity border-none bg-transparent"
        style={{ fontVariationSettings: "'opsz' 14" }}
      >
        Reserve
      </button>
      <div className="absolute h-[190px] left-[1091px] rounded-[20px] top-[398px] w-[307px]">
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none rounded-[20px]">
          <div className="absolute bg-[#d9d9d9] inset-0 rounded-[20px]" />
          <img alt="" className="absolute max-w-none object-cover rounded-[20px] size-full" src={imgRectangle12} />
        </div>
      </div>
      <p className="absolute font-['DM_Sans:Medium',sans-serif] font-medium h-[38px] leading-[normal] left-[1106px] text-[24px] text-black top-[609px] w-[71px]" style={{ fontVariationSettings: "'opsz' 14" }}>
        Darts
      </p>
      <p className="absolute font-['DM_Sans:Medium',sans-serif] font-medium h-[32px] leading-[normal] left-[1105px] text-[#797575] text-[20px] top-[655px] w-[96px]" style={{ fontVariationSettings: "'opsz' 14" }}>
        3 boards
      </p>
      <div className="absolute bg-[#ff7a05] h-[40px] left-[1244px] rounded-[10px] top-[639px] w-[142px] cursor-pointer hover:bg-[#ff8f1a] transition-colors" onClick={() => handleReserveClick("Darts")} />
      <button
        onClick={() => handleReserveClick("Darts")}
        className="absolute font-['DM_Sans:Bold',sans-serif] font-bold h-[32px] leading-[normal] left-[1270px] text-[20px] text-white top-[647px] w-[90px] cursor-pointer hover:opacity-80 transition-opacity border-none bg-transparent"
        style={{ fontVariationSettings: "'opsz' 14" }}
      >
        Reserve
      </button>
      <div className="absolute h-[190px] left-[324px] rounded-[20px] top-[755px] w-[307px]">
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none rounded-[20px]">
          <div className="absolute bg-[#d9d9d9] inset-0 rounded-[20px]" />
          <img alt="" className="absolute max-w-none object-cover rounded-[20px] size-full" src={imgRectangle12} />
        </div>
      </div>
      <p className="absolute font-['DM_Sans:Medium',sans-serif] font-medium h-[38px] leading-[normal] left-[339px] text-[24px] text-black top-[966px] w-[134px]" style={{ fontVariationSettings: "'opsz' 14" }}>
        Basketball
      </p>
      <p className="absolute font-['DM_Sans:Medium',sans-serif] font-medium h-[32px] leading-[normal] left-[338px] text-[#797575] text-[20px] top-[1012px] w-[125px]" style={{ fontVariationSettings: "'opsz' 14" }}>
        3 machines
      </p>
      <div className="absolute bg-[#ff7a05] h-[41px] left-[476px] rounded-[10px] top-[996px] w-[143px] cursor-pointer hover:bg-[#ff8f1a] transition-colors" onClick={() => handleReserveClick("Basketball")} />
      <button
        onClick={() => handleReserveClick("Basketball")}
        className="absolute font-['DM_Sans:Bold',sans-serif] font-bold h-[33px] leading-[normal] left-[503px] text-[20px] text-white top-[1004px] w-[89px] cursor-pointer hover:opacity-80 transition-opacity border-none bg-transparent"
        style={{ fontVariationSettings: "'opsz' 14" }}
      >
        Reserve
      </button>
      <div className="absolute h-[189px] left-[716px] rounded-[20px] top-[755px] w-[306px]">
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none rounded-[20px]">
          <div className="absolute bg-[#d9d9d9] inset-0 rounded-[20px]" />
          <img alt="" className="absolute max-w-none object-cover rounded-[20px] size-full" src={imgRectangle12} />
        </div>
      </div>
      <p className="absolute font-['DM_Sans:Medium',sans-serif] font-medium h-[38px] leading-[normal] left-[731px] text-[24px] text-black top-[966px] w-[187px]" style={{ fontVariationSettings: "'opsz' 14" }}>
        Function Room
      </p>
      <p className="absolute font-['DM_Sans:Medium',sans-serif] font-medium h-[33px] leading-[normal] left-[730px] text-[#797575] text-[20px] top-[1011px] w-[132px]" style={{ fontVariationSettings: "'opsz' 14" }}>
        Multipurpose
      </p>
      <div className="absolute bg-[#ff7a05] h-[41px] left-[868px] rounded-[10px] top-[995px] w-[143px] cursor-pointer hover:bg-[#ff8f1a] transition-colors" onClick={() => handleReserveClick("Function Room")} />
      <button
        onClick={() => handleReserveClick("Function Room")}
        className="absolute font-['DM_Sans:Bold',sans-serif] font-bold h-[32px] leading-[normal] left-[895px] text-[20px] text-white top-[1004px] w-[89px] cursor-pointer hover:opacity-80 transition-opacity border-none bg-transparent"
        style={{ fontVariationSettings: "'opsz' 14" }}
      >
        Reserve
      </button>
      <div className="absolute h-[189px] left-[1091px] rounded-[20px] top-[755px] w-[306px]">
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none rounded-[20px]">
          <div className="absolute bg-[#d9d9d9] inset-0 rounded-[20px]" />
          <img alt="" className="absolute max-w-none object-cover rounded-[20px] size-full" src={imgRectangle12} />
        </div>
      </div>
      <p className="absolute font-['DM_Sans:Medium',sans-serif] font-medium h-[38px] leading-[normal] left-[1106px] text-[24px] text-black top-[966px] w-[87px]" style={{ fontVariationSettings: "'opsz' 14" }}>
        Billiard
      </p>
      <p className="absolute font-['DM_Sans:Medium',sans-serif] font-medium h-[33px] leading-[normal] left-[1105px] text-[#797575] text-[20px] top-[1011px] w-[87px]" style={{ fontVariationSettings: "'opsz' 14" }}>
        4 tables
      </p>
      <div className="absolute bg-[#ff7a05] h-[41px] left-[1243px] rounded-[10px] top-[995px] w-[143px] cursor-pointer hover:bg-[#ff8f1a] transition-colors" onClick={() => handleReserveClick("Billiard")} />
      <button
        onClick={() => handleReserveClick("Billiard")}
        className="absolute font-['DM_Sans:Bold',sans-serif] font-bold h-[32px] leading-[normal] left-[1269px] text-[20px] text-white top-[1004px] w-[90px] cursor-pointer hover:opacity-80 transition-opacity border-none bg-transparent"
        style={{ fontVariationSettings: "'opsz' 14" }}
      >
        Reserve
      </button>
    </div>
  );
}