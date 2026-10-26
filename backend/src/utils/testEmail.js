const path = require('path');
const dotenv = require('dotenv');

// Load backend/.env
dotenv.config({ path: path.join(__dirname, '../../.env') });

const { 
  verifyEmailTransporter, 
  sendOtpEmail, 
  getTransporter, 
  getFromAddress 
} = require('../services/emailService');

async function runEmailDiagnostic() {
  console.log('\n=======================================================');
  console.log('🔍 Nodemailer & Gmail OTP Diagnostic Tool');
  console.log('=======================================================\n');

  const user = process.env.SMTP_USER;
  const rawPass = process.env.SMTP_PASS;
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const service = process.env.SMTP_SERVICE || 'gmail';

  console.log('📋 Current Environment Configuration:');
  console.log(` - SMTP_SERVICE : ${service}`);
  console.log(` - SMTP_HOST    : ${host}`);
  console.log(` - SMTP_USER    : ${user ? user : '[NOT SET / EMPTY]'}`);
  console.log(` - SMTP_PASS    : ${rawPass ? '•••••••••••••••• (' + rawPass.replace(/\s+/g, '').length + ' chars)' : '[NOT SET / EMPTY]'}`);
  console.log(` - SENDER FROM  : ${getFromAddress()}`);
  console.log('');

  if (!user || !rawPass || user.includes('your-email@') || rawPass.includes('your-16-char')) {
    console.log('⚠️  SMTP credentials are not configured or still have placeholder values in backend/.env!');
    console.log('\n📖 How to configure Gmail with Nodemailer:');
    console.log('  1. Open your Google Account: https://myaccount.google.com/security');
    console.log('  2. Enable "2-Step Verification" if not already enabled.');
    console.log('  3. Go to App Passwords: https://myaccount.google.com/apppasswords');
    console.log('  4. Create an app named "InterviewPrep" and copy the 16-character password.');
    console.log('  5. Open backend/.env and set:');
    console.log('       SMTP_USER=your-actual-email@gmail.com');
    console.log('       SMTP_PASS=abcd efgh ijkl mnop   (or abcdefghijklmnop)');
    console.log('  6. Run this test again with: npm --prefix backend run test:email <your-email>\n');
    process.exit(1);
  }

  console.log('⏳ 1. Verifying SMTP transporter connection...');
  const verifyResult = await verifyEmailTransporter();

  if (!verifyResult.verified) {
    console.error('\n❌ Transporter connection failed:');
    console.error(`   Error: ${verifyResult.error}`);
    if (verifyResult.hint) {
      console.error(`   💡 Hint: ${verifyResult.hint}`);
    }
    console.log('\n🔧 Troubleshooting steps:');
    console.log('  - Verify that 2-Step Verification is enabled on your Google Account.');
    console.log('  - Verify you generated an "App Password" (not your normal Gmail account password).');
    console.log('  - Verify there is no typo in your email address.');
    console.log('=======================================================\n');
    process.exit(1);
  }

  console.log('✅ SMTP connection successfully authenticated with Google!\n');

  // Determine recipient email: CLI arg, or fallback to SMTP_USER
  const targetEmail = process.argv[2] || user;
  const testOtp = Math.floor(100000 + Math.random() * 900000).toString();

  console.log(`⏳ 2. Sending test OTP email (${testOtp}) to: ${targetEmail}...`);
  const sendResult = await sendOtpEmail(targetEmail, testOtp);

  if (sendResult.success && !sendResult.simulated) {
    console.log('\n🎉 SUCCESS! Real email was delivered successfully!');
    console.log(`   Message ID : ${sendResult.messageId}`);
    console.log(`   Recipient  : ${targetEmail}`);
    console.log(`   Test OTP   : ${testOtp}`);
    console.log('\n👉 Check your inbox (and Spam/Junk folder) to view the email.\n');
  } else {
    console.error('\n❌ Email delivery failed:');
    console.error(`   ${sendResult.error || 'Unknown error'}`);
  }

  console.log('=======================================================\n');
}

runEmailDiagnostic().catch(err => {
  console.error('Fatal diagnostic error:', err);
  process.exit(1);
});
