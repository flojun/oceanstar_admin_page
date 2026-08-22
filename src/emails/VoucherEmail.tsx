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
import { getTranslation, type Language } from '@/lib/translations';

interface VoucherEmailProps {
  lang: Language;
  hasVoucher: boolean;
  name: string;
  order_id: string;
  tour_name: string;
  tour_date: string;
  pax: string;
  option: string;
  pickup_location: string;
}

export const VoucherEmail = ({
  lang,
  hasVoucher,
  name,
  order_id,
  tour_name,
  tour_date,
  pax,
  option,
  pickup_location,
}: VoucherEmailProps) => {
  const t = getTranslation(lang);
  const rows: [string, string][] = [
    [t('voucherEmail.label_order'), order_id],
    [t('voucherEmail.label_date'), tour_date],
    [t('voucherEmail.label_tour'), tour_name],
    [t('voucherEmail.label_option'), option],
    [t('voucherEmail.label_pax'), pax],
    [t('voucherEmail.label_pickup'), pickup_location],
  ];

  return (
    <Html lang={lang}>
      <Head />
      <Preview>{t('voucherEmail.preview')}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{t('voucherEmail.title')}</Heading>
          <Text style={text}>
            {t('voucherEmail.greeting').replace('{name}', name)}
            <br />
            {t('voucherEmail.intro')}
          </Text>

          <Section style={infoSection}>
            <Heading as="h2" style={h2}>
              {t('voucherEmail.details_title')}
            </Heading>
            {rows.map(([label, value]) => (
              <Text key={label} style={infoText}>
                <strong>{label}:</strong> {value}
              </Text>
            ))}
          </Section>

          <Text style={hasVoucher ? text : noticeBox}>
            {t(hasVoucher ? 'voucherEmail.attachment_notice' : 'voucherEmail.no_voucher_notice')}
          </Text>

          <Hr style={hr} />
          <Text style={footer}>
            {t('voucherEmail.notice_title')}<br />
            - {t('voucherEmail.notice_1')}<br />
            - {t('voucherEmail.notice_2')}<br />
            - {t('voucherEmail.notice_3')}<br />
            <br />
            {t('voucherEmail.contact')}
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

const noticeBox = {
  color: '#8a5a00',
  backgroundColor: '#fff8e6',
  border: '1px solid #ffe2a8',
  borderRadius: '8px',
  padding: '16px',
  fontSize: '15px',
  lineHeight: '1.6',
  marginBottom: '20px',
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
