import React from 'react';
import Image from 'next/image';

interface TimelineItem {
  title: string;
  duration?: string;
  description: string;
  imgSrc: string;
}

const courseData: TimelineItem[] = [
  {
    title: "호텔 픽업",
    duration: "20분 소요",
    description: "알로하~ 호텔에서 가장 가까운 픽업 장소에서 한국인 가이드가 픽업해 드리며 픽업 시간은 개별 안내해 드립니다.",
    imgSrc: "/images/timeline/pickup.png"
  },
  {
    title: "케알로 하버 선착장 도착",
    description: "와이키키에서 15분 거리에 위치한 아름다운 케알로 하버에서 거북이 스노클링 투어를 위한 배에 탑승하십니다.",
    imgSrc: "/images/timeline/harbor.png"
  },
  {
    title: "거북이 스노클링",
    duration: "180분 소요",
    description: "와이키키 터틀 캐니언의 자연산 바다 거북이와 다양한 태평양 속 물고기와 함께 스노클링을 즐겨 보세요.",
    imgSrc: "/images/timeline/snorkeling.png"
  },
  {
    title: "스탠드업 패들보드",
    description: "이효리씨 & 야노시호씨의 !원픽! 와이키키 앞 바다에서 즐기는 스탠드업 패들 보드에 도전하세요.\n복근 코어 운동은 보너스~!",
    imgSrc: "/images/timeline/paddleboard.png"
  },
  {
    title: "씨카약",
    description: "태평양에 둥실둥실~ 씨카약을 타고 와이키키 바다의 시원함을 만끽해보세요.",
    imgSrc: "/images/timeline/kayak.png"
  },
  {
    title: "선상 보트 다이빙",
    description: "ONLY 하와이가자 에서만 즐기는 와이키키 터틀 캐니언의 유일한 보트 다이빙, 놓치지 마세요!",
    imgSrc: "/images/timeline/diving_clean.png"
  },
  {
    title: "씨두 스쿠터",
    description: "바다 속의 스쿠터~ 작지만 강한 위력의 프로펠러로 와이키키 바다를 누벼보세요!",
    imgSrc: "/images/timeline/scooter.png"
  },
  {
    title: "호텔 드랍오프",
    duration: "20분 소요",
    description: "아쉽지만 트립 마무리! 와이키키 호텔로 안전하게 모셔다 드립니다.\n특별한 경험, 행복한 추억, 인생샷 모두 오래오래 간직하세요~",
    imgSrc: "/images/timeline/dropoff.png"
  }
];

export default function TourCourseTimeline({ isSunset = false }: { isSunset?: boolean }) {
  const displayData = [...courseData];
  if (isSunset) {
    const scooterIndex = displayData.findIndex(item => item.title === "씨두 스쿠터");
    if (scooterIndex !== -1) {
      displayData.splice(scooterIndex + 1, 0, {
        title: "와인과 치즈보드 with 선셋",
        description: "액티비티후 와인과 치즈보드 그리고 선셋을 함께 즐기세요!",
        imgSrc: "/images/timeline/sunset_wine.jpg"
      });
    } else {
      displayData.splice(displayData.length - 1, 0, {
        title: "와인과 치즈보드 with 선셋",
        description: "액티비티후 와인과 치즈보드 그리고 선셋을 함께 즐기세요!",
        imgSrc: "/images/timeline/sunset_wine.jpg"
      });
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto py-4 px-2 sm:px-6">
      <h3 className="text-2xl font-black text-slate-900 border-b-2 border-slate-900 pb-3 mb-8">코스 일정</h3>
      
      <div className="relative border-l-[3px] border-slate-200 ml-4 sm:ml-6 md:ml-8 space-y-12 pb-8">
        {displayData.map((item, index) => (
          <div key={index} className="relative pl-8 sm:pl-10 md:pl-12 flex flex-col md:flex-row md:items-center gap-6 group">
            {/* Timeline Dot */}
            <div className="absolute -left-[11px] top-1 w-5 h-5 bg-white border-4 border-slate-300 rounded-full group-hover:border-blue-500 transition-colors duration-300 z-10 shadow-sm"></div>

            {/* Text Content */}
            <div className="flex-1">
              <h4 className="text-lg sm:text-xl font-bold text-slate-900 mb-1">{item.title}</h4>
              {item.duration && (
                <p className="text-sm font-medium text-slate-500 mb-2">{item.duration}</p>
              )}
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed whitespace-pre-line mt-2">
                {item.description}
              </p>
            </div>

            {/* Image Thumbnail */}
            <div className="relative w-full md:w-48 h-48 md:h-36 shrink-0 rounded-2xl overflow-hidden shadow-md border border-slate-100 group-hover:shadow-lg transition-shadow duration-300 mt-4 md:mt-0">
              <Image 
                src={item.imgSrc} 
                alt={item.title} 
                fill
                className="object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
