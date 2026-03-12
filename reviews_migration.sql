-- =============================================
-- 고객 리뷰 테이블 마이그레이션
-- =============================================

CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id VARCHAR NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    content TEXT NOT NULL,
    author_name VARCHAR NOT NULL,
    is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 인덱스 추가 (예약 번호 및 숨김 여부 조회를 빠르게 하기 위함)
CREATE INDEX IF NOT EXISTS idx_reviews_order_id ON reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_is_hidden ON reviews(is_hidden);

-- Row Level Security (RLS) 설정 (선택 사항이지만 권장)
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- 퍼블릭 조회 허용 정책 (is_hidden이 false인 것만)
CREATE POLICY "Public profiles are viewable by everyone." ON reviews
    FOR SELECT USING (is_hidden = false);

-- 퍼블릭 인서트 허용 (API 서버에서 insert 하므로 실제로는 서비스 롤이나 인증된 유저만 허용해도 됨. 하지만 여기선 예시로)
-- 단, 실제로는 서버(route.ts)에서 제어하므로 service_role API key를 사용한다면 RLS를 우회할 수 있습니다.
CREATE POLICY "Anyone can insert a review." ON reviews
    FOR INSERT WITH CHECK (true);
