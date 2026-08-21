import dotenv from 'dotenv';
import path from 'path';

// Load env vars FIRST
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// THEN import the email module
async function run() {
  const { sendVoucherEmail } = await import('../src/lib/email');

  console.log('Testing email directly...');
  console.log('Using email:', process.env.NODEMAILER_EMAIL);
  console.log('Password length:', process.env.NODEMAILER_PW?.length);
  
  try {
    await sendVoucherEmail({
      to: process.env.NODEMAILER_EMAIL || '',
      name: 'Test Customer',
      order_id: 'TEST1234',
      tour_name: '오션스타 하와이 거북이 스노클링',
      tour_date: '2026-04-20',
      pax: '성인 2인',
      option: '1부 거북이스노클링 (07:30)',
      pickup_location: 'H&M',
    });
    console.log('Test email finished successfully!');
  } catch (error) {
    console.error('Failed to send test email:', error);
  }
}

run();
