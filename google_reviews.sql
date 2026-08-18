-- =============================================
-- Google Reviews 테이블 생성 및 샘플 데이터 삽입
-- Supabase 대시보드 > SQL Editor에서 실행하세요.
-- =============================================

-- 1. google_reviews 테이블 생성
CREATE TABLE IF NOT EXISTS google_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name TEXT NOT NULL,
  profile_photo TEXT,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  content TEXT NOT NULL,
  review_photos TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_visible BOOLEAN DEFAULT TRUE
);

-- 2. 오션스타 실제 베스트 리뷰 5개 삽입
INSERT INTO google_reviews (author_name, rating, content, review_photos) VALUES
(
  'Kiya C.',
  5,
  'Amazing!! Didn''t know it was a Korean boat experience and I wouldn''t have had it any other way. The staff was so helpful with the dive! They took such good pictures and the ramen after was amazing 20/10 experience, Highly recommended. (스태프들이 너무 친절했고 사진도 잘 찍어주셨어요. 스노클링 후 먹은 컵라면은 정말 최고였습니다! 20/10점 만점!)',
  ARRAY[]::TEXT[]
),
(
  'Paul N.',
  5,
  'Oceanstar boat and crew were great! Troy and Zoey were great with instructions! We saw lots of fishes and the turtles were huge! (오션스타 배와 크루들 모두 훌륭했습니다! 설명도 너무 잘해주셨고, 물고기도 많이 보고 거북이도 엄청 컸어요!)',
  ARRAY[]::TEXT[]
),
(
  '지연 (Ji Yeon)',
  5,
  '가이드분이 너무 친절하셨고, 간식과 음료도 완벽하게 준비되어 있었어요. 거북이와 물고기들을 원 없이 보고 난 뒤 다같이 본 하와이의 일몰은 정말 최고였습니다. 다음에도 무조건 다시 탈 거예요!',
  ARRAY[]::TEXT[]
),
(
  'Daisy M.',
  5,
  'Having our guide was like having our very own mermaid! We saw a lot of turtles and tons of fish! We swam a good distance, too! It was AMAZING!',
  ARRAY[]::TEXT[]
),
(
  'Michael T.',
  5,
  'Super fun time! The crew went above and beyond and made sure we had an incredible time... We saw so many turtles! 바다 위에서 먹은 간식도 정말 꿀맛이었습니다. 최고!',
  ARRAY[]::TEXT[]
);
