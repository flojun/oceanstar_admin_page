import nodemailer from 'nodemailer';
import { render } from '@react-email/render';
import VoucherEmail from '@/emails/VoucherEmail';
import { getVoucherAttachments } from '@/lib/voucherFiles';
import React from 'react';

// Nodemailer transport
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.NODEMAILER_EMAIL,
    pass: process.env.NODEMAILER_PW,
  },
});

export async function sendVoucherEmail({
  to,
  name,
  order_id,
  tour_name,
  tour_date,
  pax,
  option,
  pickup_location,
}: {
  to: string;
  name: string;
  order_id: string;
  tour_name: string;
  tour_date: string;
  pax: string;
  option: string;
  pickup_location: string;
}) {
  const emailHtml = await render(
    React.createElement(VoucherEmail, {
      name,
      order_id,
      tour_name,
      tour_date,
      pax,
      option,
      pickup_location,
    })
  );

  // 한국어 + 영어 바우처를 모두 첨부한다. 파일을 못 받아와도 메일은 나간다.
  const attachments = await getVoucherAttachments(pickup_location, option);

  const options = {
    from: `"오션스타 하와이" <${process.env.NODEMAILER_EMAIL}>`,
    to,
    subject: `[오션스타] 예약 확정 안내 (예약번호: ${order_id})`,
    html: emailHtml,
    attachments,
  };

  await transporter.sendMail(options);
  console.log(`Voucher email sent successfully to ${to} for order ${order_id} (첨부 ${attachments.length}개)`);
}
