import nodemailer from 'nodemailer';
import { render } from '@react-email/render';
import VoucherEmail from '@/emails/VoucherEmail';
import path from 'path';
import fs from 'fs';
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

  // 1부 or 2부 판단
  const isSession2 = option.includes('2부') || option.includes('11:00');
  const sessionString = isSession2 ? '2부' : '1부';

  // pickup_location 매핑 처리
  let locFilePrefix = pickup_location;
  if (pickup_location === 'HM' || pickup_location === 'H&M') locFilePrefix = 'H&M';
  else if (pickup_location === '녹색천막') locFilePrefix = '소화전';
  else if (pickup_location === '아이홉' || pickup_location === 'IHOP') locFilePrefix = 'IHOP';
  else if (pickup_location === '알라모아나') locFilePrefix = '알모';
  else if (pickup_location === 'HP') locFilePrefix = 'HP';
  else if (pickup_location === 'HGI') locFilePrefix = 'HGI';
  else if (pickup_location === 'HIE') locFilePrefix = 'HIE';
  else if (pickup_location === 'WR') locFilePrefix = 'WR';
  else if (pickup_location === '카라이') locFilePrefix = '카라이';
  else if (pickup_location === '르네상스') locFilePrefix = '르네상스';
  else if (pickup_location === '프린스') locFilePrefix = '프린스';
  else if (pickup_location === '직접') locFilePrefix = '직접';
  else if (pickup_location.includes('카할라')) locFilePrefix = '카할라';

  const fileName = `${locFilePrefix} ${sessionString}.pdf`;
  const filePath = path.join(process.cwd(), 'public', 'assets', 'voucher', fileName);

  const attachments = [];
  if (fs.existsSync(filePath)) {
    attachments.push({
      filename: `오션스타_${fileName}`,
      path: filePath,
    });
  } else {
    console.warn(`Voucher file not found at: ${filePath}`);
  }

  const options = {
    from: `"오션스타 하와이" <${process.env.NODEMAILER_EMAIL}>`,
    to,
    subject: `[오션스타] 예약 확정 안내 (예약번호: ${order_id})`,
    html: emailHtml,
    attachments,
  };

  await transporter.sendMail(options);
  console.log(`Voucher email sent successfully to ${to} for order ${order_id}`);
}
