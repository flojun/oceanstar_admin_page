import React, { useState } from 'react';
import { ChevronDown, MessageCircleQuestion } from 'lucide-react';

const faqData = [
  {
    category: "참여 자격 & 안전",
    items: [
      {
        q: "수영을 전혀 못해도 참여할 수 있나요?",
        a: "네, 가능합니다. 한국인 맞춤 고부력 구명조끼를 착용하고, 한국인 전문 크루가 수중에서 직접 옆에서 도와드립니다. 거북이 바로 옆까지 안전하게 데려다 드리는 것이 저희 크루의 역할입니다. 수영을 못하는 분들이 오히려 \"이래서 왔어야 했다\"고 말씀하시는 투어입니다. 보트에서만 즐기거나 물 위에서 거북이 보는 분들도 많습니다."
      },
      {
        q: "아이들도 탈 수 있나요? 몇 살부터 가능한가요?",
        a: "만 24개월 이상부터 참여 가능합니다. 미성년자는 반드시 보호자와 동반해야 합니다. 한국어로 소통 가능한 크루가 아이들도 세심하게 케어하며, 실제로 가족 단위 여행객의 만족도가 가장 높은 투어입니다."
      },
      {
        q: "임산부도 참여할 수 있나요?",
        a: "건강 상태에 이상이 없는 임산부라면 충분히 참여 가능합니다. 거북이 스노클링과 보트 이동은 무리 없이 즐기실 수 있으며, 격한 액티비티만 자제하시면 됩니다. 예약 시 임신 사실을 미리 알려주시면 크루가 더욱 세심하게 케어해 드립니다."
      },
      {
        q: "배멀미가 심한 편인데 괜찮을까요?",
        a: "걱정되신다면 출발 1시간 전 멀미약을 미리 복용해 오시기를 권장드립니다. 와이키키 항구에서 터틀캐년까지는 약 15–20분 거리로 이동 시간이 짧습니다. 소형 보트와 달리 51인승 대형 선박은 파도에 매우 안정적이며, 저희 루프탑 보트는 안정적인 구조로 설계되어 있어 일반 보트 대비 흔들림이 적습니다."
      },
      {
        q: "노약자나 고령자도 참여 가능한가요?",
        a: "건강 상태가 양호하다면 참여 가능합니다. 다만 수상 액티비티 특성상 전신 질환, 심장 질환, 관절 이상 등이 있으신 분은 예약 전 반드시 문의해 주세요. 스노클링 없이 보트 위에서 관람만 하는 것도 가능합니다. 저희 배는 51인승 대형 선박으로 흔들림이 적어 노약자도 안전합니다."
      }
    ]
  },
  {
    category: "예약 & 운영",
    items: [
      {
        q: "예약 후 확인은 어떻게 받나요?",
        a: "예약 확정 후 예약하신 사이트 메시지/카카오톡으로 확정 문자와 상세 안내(픽업 시간, 장소, 준비물)를 보내드립니다. 별도로 바우처를 출력하실 필요 없으며, 예약하신 사이트 메시지/카카오톡 확정 문자가 바우처를 대신합니다. 예약 시 반드시 카카오톡 연락 가능한 번호를 남겨 주세요."
      },
      {
        q: "픽업은 어디서 하나요? 호텔까지 와주나요?",
        a: "와이키키 지역 내 호텔 메인 입구 또는 가까운 지정 장소에서 픽업해 드립니다. 숙소 위치에 따라 길 건너편이나 인근 빌딩 앞이 픽업 포인트가 될 수 있으며, 예약시, 정확한 장소와 시간을 안내해 드립니다. 와이키키 외 지역 픽업은 별도 문의 부탁드립니다."
      },
      {
        q: "몇 명부터 예약이 가능한가요? 혼자도 예약할 수 있나요?",
        a: "1명부터 예약 가능합니다. 일반 투어는 최소 10명 모객이 되어야 출발하며, 인원 미달 시 날짜 변경 또는 환불 처리됩니다. 혼자 혹은 소수 인원이 확실히 원하는 날짜에 타고 싶다면 프라이빗 단독 전세를 이용하시면 됩니다."
      },
      {
        q: "1부와 2부 중 어떤 걸 선택하는 게 좋나요?",
        a: "1부(07:30–11:30)는 바다가 가장 잔잔하고 거북이 활동이 활발한 시간대로 추천드립니다. 2부(10:30–14:30)는 아침 준비가 여유로운 분께 적합합니다. 단, 2부는 모객 인원 부족 시 1부 합류 또는 날짜 변경이 될 수 있습니다."
      },
      {
        q: "얼마나 빨리 예약해야 하나요, 당일 예약도 가능한가요?",
        a: "저희 투어는 인기가 높아 특히 성수기에는 수 주 전에 마감되는 경우가 많습니다. 원하시는 날짜가 정해졌다면 가능한 빨리 예약하시기를 강력히 권장드립니다. 당일 예약도 가능하지만, 자리 보장이 어렵습니다."
      }
    ]
  },
  {
    category: "투어 내용 & 거북이",
    items: [
      {
        q: "거북이를 정말 100% 볼 수 있나요?",
        a: "네, 자연산 거북이를 100% 보장하는 것이 저희의 가장 큰 자부심입니다. 하와이 한인 최초로 터틀캐년 스노클링을 시작한 원조 업체로서, 어느 포인트에서 거북이를 만날 수 있는지 누구보다 잘 알고 있습니다. 만약 거북이를 만나지 못하셨다면 재방문 시 특별 혜택을 제공합니다. 단, 이런 경우는 극히 드뭅니다."
      },
      {
        q: "투어가 총 몇 시간인가요? 어떤 순서로 진행되나요?",
        a: "총 4시간 진행됩니다. 호텔 픽업 → 케왈로 하버 승선 → 터틀캐니언 이동(15분) → 거북이 스노클링 + 5종 해양 액티비티 → 선상 스냅샷 + 간식 → 하버 복귀 → 호텔 드랍 순으로 진행됩니다. 타 업체 대비 1시간 더 넉넉하게 운영하여 모든 프로그램을 여유 있게 즐기실 수 있습니다."
      },
      {
        q: "5종 해양 액티비티가 정확히 무엇인가요? 모두 강제 참여인가요?",
        a: "스탠드업 패들보드, 씨카약, 씨두 스쿠터, 선상 보트다이빙, 씨체어입니다. 모두 자유 참여이며 원하지 않는 항목은 건너뛰셔도 됩니다. 보트 위에서 쉬거나 경치를 즐기시는 분들도 많습니다."
      },
      {
        q: "돌고래나 다른 바다 생물도 볼 수 있나요?",
        a: "가능성이 있습니다. 한 달에 3–4회 정도 돌고래 떼가 출몰하며, 다양한 열대어와 산호도 만나실 수 있습니다. 매우 드물게 혹등고래나 만타레이가 목격되기도 합니다. 다만 거북이 외 생물은 자연 조건에 따라 달라지므로 보장은 어렵습니다."
      }
    ]
  },
  {
    category: "준비물 & 현장",
    items: [
      {
        q: "무엇을 준비해 가면 되나요?",
        a: "수영복과 타올만 챙겨 오시면 됩니다. 스노클링 장비 일체, 구명조끼, 라면·스낵·음료가 모두 무료 제공됩니다. 선크림과 개인 용품은 별도 지참을 권장하며, 스노클링 후 체온이 떨어질 수 있으므로 후드티나 가벼운 겉옷을 챙기시면 좋습니다."
      },
      {
        q: "사진이나 영상은 어떻게 남길 수 있나요?",
        a: "선상에서 다이아몬드헤드와 와이키키를 배경으로 인생샷을 무료로 찍어드립니다. 수중 촬영을 원하신다면 고프로 대여($40, SD카드 포함)를 추가하시면 베테랑 크루가 다이브하여 거북이와 함께하는 근접 수중 사진·영상을 직접 찍어드립니다."
      },
      {
        q: "현장에 화장실이나 샤워 시설이 있나요?",
        a: "보트 내에 화장실이 있습니다. 또한 케왈로 하버 공원 주차장에 공용 화장실과 샤워 시설이 있으니, 탑승 전후로 자유롭게 이용하실 수 있습니다."
      }
    ]
  },
  {
    category: "프라이빗 & 특수 상황",
    items: [
      {
        q: "날씨가 나쁘면 어떻게 되나요?",
        a: "기상 악화 또는 해안경비대 지시로 투어 운항이 불가한 경우 전액 환불 또는 날짜 변경이 가능합니다. 단, 저희 루프탑 보트는 와이키키 유일한 나무 루프탑 구조로 가벼운 비에도 쾌적하게 진행됩니다. 취소 여부는 당일 오전 현지 상황에 따라 사전 통보해 드립니다."
      },
      {
        q: "생일, 돌잔치, 기업 행사 등 단체 이벤트도 가능한가요?",
        a: "네, 프라이빗 단독 전세 상품을 통해 가능합니다. 51인승 보트 전체를 빌려 여러분만의 행사를 진행할 수 있으며, 생일 케이크·데코레이션·케이터링·포토그래퍼 등 추가 구성도 협의 가능합니다. 기업 MT, 웨딩파티, 돌잔치, 생일 파티, 대가족 모임 등 다양한 행사로 이용되고 있습니다. 상세 견적은 별도 문의 부탁드립니다."
      },
      {
        q: "매너팁은 꼭 줘야 하나요? 얼마가 적당한가요?",
        a: "법적 의무는 아니지만 미국 문화에서 팁은 서비스에 대한 감사 표현입니다. 만족스러운 투어를 경험하셨다면 1인당 $10–$20 정도를 권장드립니다. 크루들이 여러분의 안전과 즐거움을 위해 진심을 다하는 만큼, 좋은 에너지로 보답해 주시면 크루들에게 큰 힘이 됩니다."
      }
    ]
  },
  {
    category: "기타",
    items: [
      {
        q: "수영복은 미리 입고 가야 하나요?",
        a: "네, 수영복은 미리 착용하고 오시는 것을 추천합니다."
      },
      {
        q: "캐리어나 짐 보관 가능한가요?",
        a: "스노클링 관련된 개인 짐은 보관이 가능하나, 배 공간 제한으로 대형 캐리어는 픽업 전 호텔에 맡기시는 걸 추천합니다."
      },
      {
        q: "음식이나 음료가 제공되나요?",
        a: "투어 중 간단한 스낵과 음료가 제공됩니다."
      },
      {
        q: "예약 변경이 가능한가요?",
        a: "가능한 경우 일정 변경을 도와드리며, 자세한 내용은 예약 플랫폼 규정을 따릅니다."
      },
      {
        q: "왜 대박하와이(오션스타)를 선택해야 하나요?",
        a: "하와이 한인 대상 거북이 스노클링 최초 시작 + 마이리얼트립 6,500+ · 구글 5,000+ 리뷰 No.1. 루프탑 보트·한국어 풀케어·5종 액티비티·거북이 보장까지, 수천 명이 \"하와이 최고의 추억\"이라고 말합니다."
      },
      {
        q: "거북이를 만지거나 같이 사진 찍어도 되나요?",
        a: "하와이 법에 따라 거북이는 보호동물로 지정되어 있어 최소 2~3m 거리를 유지해야 하며 만지는 것은 금지됩니다. 하지만 가이드가 거북이와 함께 나오는 완벽한 각도의 사진을 찍어드리니 걱정 마세요!"
      },
      {
        q: "픽업 시간을 놓치면 어떻게 되나요?",
        a: "픽업 5~10분 늦어도 대기하지만, 15분 이상 지연 시 별도 이동 부담(택시 등) 발생할 수 있습니다. 미리 연락 주세요."
      }
    ]
  }
];

export default function FAQSection() {
  const [activeTab, setActiveTab] = useState(0);
  const [openItems, setOpenItems] = useState<Record<number, boolean>>({});

  const toggleItem = (index: number) => {
    setOpenItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <section className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 mt-20 mb-20 relative z-30">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight flex items-center justify-center gap-3">
          <MessageCircleQuestion className="text-blue-500 w-10 h-10" />
          자주 묻는 질문 (FAQ)
        </h2>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
          예약 전 가장 궁금해하시는 질문들을 카테고리별로 모았습니다.
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden flex flex-col md:flex-row min-h-[500px]">
        
        {/* Sidebar / Tabs */}
        <div className="w-full md:w-1/3 bg-slate-50 p-4 sm:p-6 border-b md:border-b-0 md:border-r border-slate-200">
          <h3 className="font-bold text-slate-800 mb-4 px-2 tracking-tight">카테고리 분류</h3>
          <div className="flex flex-row md:flex-col gap-2 overflow-x-auto pb-3 md:pb-0 mobile-scrollbar">
            {faqData.map((category, index) => (
              <button
                key={index}
                onClick={() => {
                  setActiveTab(index);
                  setOpenItems({}); // Reset open items when switching tabs
                }}
                className={`whitespace-nowrap px-4 py-3 rounded-xl text-left font-bold transition-all ${
                  activeTab === index 
                    ? 'bg-blue-600 text-white shadow-md transform scale-[1.02]' 
                    : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
                }`}
              >
                {category.category}
                <span className={`ml-2 text-xs py-0.5 px-2 rounded-full ${
                  activeTab === index ? 'bg-white/20' : 'bg-slate-200 text-slate-500'
                }`}>
                  {category.items.length}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="w-full md:w-2/3 p-4 sm:p-8 bg-white">
          <h3 className="text-2xl font-extrabold text-slate-800 mb-6 pb-4 border-b border-slate-100 flex items-center justify-between">
            {faqData[activeTab].category}
            <span className="text-sm font-medium text-slate-400 bg-slate-100 px-3 py-1 rounded-full">총 {faqData[activeTab].items.length}개</span>
          </h3>
          
          <div className="space-y-4">
            {faqData[activeTab].items.map((item, index) => {
              const isOpen = !!openItems[index];
              return (
                <div 
                  key={index} 
                  className={`border rounded-2xl overflow-hidden transition-all duration-300 ${
                    isOpen ? 'border-blue-400 shadow-md bg-blue-50/10' : 'border-slate-200 hover:border-blue-200'
                  }`}
                >
                  <button
                    onClick={() => toggleItem(index)}
                    className="w-full flex items-center justify-between p-5 sm:p-6 text-left focus:outline-none"
                  >
                    <div className="flex gap-4 items-start pr-4">
                       <span className={`font-black text-xl leading-none mt-0.5 ${isOpen ? 'text-blue-600' : 'text-slate-300'}`}>Q.</span>
                       <span className={`font-bold text-slate-800 ${isOpen ? 'text-blue-900' : ''}`}>{item.q}</span>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-500' : ''}`} />
                  </button>
                  
                  <div 
                    className={`transition-all duration-300 ease-in-out ${
                      isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="p-5 sm:p-6 pt-0 text-slate-600 leading-relaxed border-t border-slate-100/50 bg-slate-50/50 flex gap-4">
                       <span className="font-black text-xl leading-none mt-0.5 text-blue-500 opacity-60">A.</span>
                       <p className="flex-1 whitespace-pre-wrap text-[15px]">{item.a}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Mobile scrollbar styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 767px) {
            .mobile-scrollbar::-webkit-scrollbar {
                height: 4px;
                display: block;
            }
            .mobile-scrollbar::-webkit-scrollbar-track {
                background: #f8fafc;
                border-radius: 4px;
            }
            .mobile-scrollbar::-webkit-scrollbar-thumb {
                background: #cbd5e1;
                border-radius: 4px;
            }
        }
        @media (min-width: 768px) {
            .mobile-scrollbar::-webkit-scrollbar {
                display: none;
            }
            .mobile-scrollbar {
                -ms-overflow-style: none;
                scrollbar-width: none;
            }
        }
      `}} />
    </section>
  );
}
