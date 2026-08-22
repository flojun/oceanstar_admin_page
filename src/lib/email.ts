import nodemailer from 'nodemailer';
import { render } from '@react-email/render';
import VoucherEmail from '@/emails/VoucherEmail';
import { resolveVoucherFile, getVoucherAttachment } from '@/lib/voucherFiles';
import { getTranslation, type Language } from '@/lib/translations';
import React from 'react';

// Nodemailer transport
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.NODEMAILER_EMAIL,
    pass: process.env.NODEMAILER_PW,
  },
});

const LANGS: Language[] = ['ko', 'en'];

interface VoucherMail {
  to: string;
  name: string;
  order_id: string;
  tour_name: string;
  tour_date: string;
  pax: string;
  option: string;
  pickup_location: string;
}

/**
 * 예약 확정 메일을 한국어 1통, 영어 1통 보낸다.
 * 각 메일에는 해당 언어의 바우처 PDF만 첨부한다.
 * 한 통이 실패해도 나머지 한 통은 계속 보낸다.
 */
export async function sendVoucherEmail(booking: VoucherMail) {
  const { to, option, pickup_location, order_id } = booking;

  // 선셋 시간 조회가 들어 있어 언어당 한 번씩 하지 않고 한 번만 푼다.
  const fileName = await resolveVoucherFile(pickup_location, option);

  const results = await Promise.allSettled(
    LANGS.map(async (lang) => {
      const t = getTranslation(lang);
      const attachment = fileName ? await getVoucherAttachment(lang, fileName) : null;

      const html = await render(
        React.createElement(VoucherEmail, { lang, ...booking })
      );

      await transporter.sendMail({
        from: `"오션스타 하와이" <${process.env.NODEMAILER_EMAIL}>`,
        to,
        subject: t('voucherEmail.subject').replace('{id}', order_id),
        html,
        attachments: attachment ? [attachment] : [],
      });

      return { lang, attached: Boolean(attachment) };
    })
  );

  results.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      console.log(`Voucher email (${r.value.lang}) sent to ${to} for ${order_id}` +
        (r.value.attached ? '' : ' — 첨부 없음'));
    } else {
      console.error(`Voucher email (${LANGS[i]}) failed for ${order_id}:`, r.reason);
    }
  });

  if (results.every(r => r.status === 'rejected')) {
    throw new Error(`두 언어 모두 메일 발송에 실패했습니다 (${order_id})`);
  }
}
