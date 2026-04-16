import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface VoucherEmailProps {
  name: string;
  order_id: string;
  tour_name: string;
  tour_date: string;
  pax: string;
  option: string;
  pickup_location: string;
}

export const VoucherEmail = ({
  name,
  order_id,
  tour_name,
  tour_date,
  pax,
  option,
  pickup_location,
}: VoucherEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>오션스타 하와이 거북이 스노클링 예약 확정 바우처입니다.</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>예약이 확정되었습니다.</Heading>
          <Text style={text}>
            안녕하세요, {name}님!
            <br />
            오션스타 하와이 거북이 스노클링 투어를 예약해 주셔서 감사합니다.
            결제가 정상적으로 완료되어 예약이 확정되었습니다.
          </Text>

          <Section style={infoSection}>
            <Heading as="h2" style={h2}>
              예약 상세 정보
            </Heading>
            <Text style={infoText}>
              <strong>예약 번호:</strong> {order_id}
            </Text>
            <Text style={infoText}>
              <strong>투어 날짜:</strong> {tour_date}
            </Text>
            <Text style={infoText}>
              <strong>투어 상품:</strong> {tour_name}
            </Text>
            <Text style={infoText}>
              <strong>예약 옵션:</strong> {option}
            </Text>
            <Text style={infoText}>
              <strong>예약 인원:</strong> {pax}
            </Text>
            <Text style={infoText}>
              <strong>픽업 장소:</strong> {pickup_location}
            </Text>
          </Section>

          <Text style={text}>
            자세한 픽업 시간 및 안내 사항은 첨부된 바우처 파일(PDF)을 반드시 확인해 주시기 바랍니다.
          </Text>

          <Hr style={hr} />
          <Text style={footer}>
            안내 사항<br />
            - 픽업 시간 5분전까지로 지정된 장소에 대기해 주시기 바랍니다.<br />
            - 일자 변경은 투어일 기준 7일 전까지만 가능합니다.<br />
            - 당일 취소 및 노쇼는 환불이 불가합니다.<br />
            <br />
            오션스타 문의 (카카오톡 ID : hioceanstar)
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default VoucherEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px 20px',
  borderRadius: '8px',
  border: '1px solid #eee',
  maxWidth: '600px',
};

const h1 = {
  color: '#1a5f7a',
  fontSize: '24px',
  fontWeight: 'bold',
  marginTop: '0',
  marginBottom: '20px',
  textAlign: 'center' as const,
};

const h2 = {
  color: '#333',
  fontSize: '18px',
  fontWeight: 'bold',
  marginTop: '0',
  marginBottom: '16px',
};

const text = {
  color: '#555',
  fontSize: '16px',
  lineHeight: '1.6',
  marginBottom: '20px',
};

const infoSection = {
  backgroundColor: '#f8f9fa',
  padding: '24px',
  borderRadius: '8px',
  marginBottom: '24px',
  border: '1px solid #e9ecef',
};

const infoText = {
  color: '#333',
  fontSize: '15px',
  lineHeight: '1.5',
  margin: '8px 0',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
};

const footer = {
  color: '#8898aa',
  fontSize: '13px',
  lineHeight: '1.5',
  marginTop: '16px',
};
