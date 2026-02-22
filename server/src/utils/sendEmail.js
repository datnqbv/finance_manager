import nodemailer from 'nodemailer';

// Kiểm tra email đã được cấu hình chưa
const isEmailConfigured = () => {
  return (
    process.env.EMAIL_USER && 
    process.env.EMAIL_PASS && 
    process.env.EMAIL_USER !== 'your-email@gmail.com' &&
    process.env.EMAIL_PASS !== 'your-app-password-16-characters'
  );
};

// Tạo transporter
const createTransporter = () => {
  if (!isEmailConfigured()) {
    return null;
  }
  
  return nodemailer.createTransport({
    service: 'gmail', // Hoặc 'hotmail', 'outlook', etc.
    auth: {
      user: process.env.EMAIL_USER, // Email của bạn
      pass: process.env.EMAIL_PASS, // App Password (không phải mật khẩu Gmail thường)
    },
  });
};

// Gửi email reset password
export const sendResetPasswordEmail = async (email, resetToken, userName) => {
  try {
    // Nếu email chưa được cấu hình, log ra console
    if (!isEmailConfigured()) {
      console.log('⚠️  Email chưa được cấu hình. Mã reset:', resetToken);
      return { 
        success: true, 
        mode: 'demo',
        message: 'Email chưa cấu hình, trả về mã trực tiếp' 
      };
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: `"Finance Manager" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Đặt lại mật khẩu - Finance Manager',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f9f9f9;
            }
            .header {
              background-color: #0ea5e9;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background-color: white;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .token-box {
              background-color: #e0f2fe;
              border: 2px solid #0ea5e9;
              border-radius: 8px;
              padding: 20px;
              text-align: center;
              margin: 20px 0;
            }
            .token {
              font-size: 32px;
              font-weight: bold;
              color: #0ea5e9;
              letter-spacing: 5px;
            }
            .warning {
              background-color: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 10px 15px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              color: #666;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💰 Finance Manager</h1>
            </div>
            <div class="content">
              <h2>Xin chào ${userName}!</h2>
              <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản của mình.</p>
              
              <p>Đây là mã xác thực của bạn:</p>
              
              <div class="token-box">
                <div class="token">${resetToken}</div>
                <p style="margin-top: 10px; color: #666;">Mã có hiệu lực trong 10 phút</p>
              </div>
              
              <p>Vui lòng sử dụng mã này để đặt lại mật khẩu của bạn.</p>
              
              <div class="warning">
                <strong>⚠️ Lưu ý:</strong> Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này và mật khẩu của bạn sẽ không bị thay đổi.
              </div>
              
              <p>Trân trọng,<br><strong>Finance Manager Team</strong></p>
            </div>
            <div class="footer">
              <p>Email này được gửi tự động, vui lòng không trả lời.</p>
              <p>&copy; 2024 Finance Manager. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent:', info.messageId);
    return { success: true, mode: 'email', messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email error:', error);
    return { success: false, error: error.message };
  }
};

// ─── Gửi thông báo liên hệ cho admin ───────────────────────────────────────
export const sendContactNotificationToAdmin = async ({ name, email, subject, message, createdAt }) => {
  try {
    if (!isEmailConfigured()) {
      console.log('📩 [Contact - demo mode] Tin nhắn từ:', name, email, subject);
      return { success: true, mode: 'demo' };
    }

    const transporter = createTransporter();
    const time = new Date(createdAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

    const mailOptions = {
      from: `"Finance Manager System" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      replyTo: email,
      subject: `[Liên hệ mới] ${subject}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f8fafc; }
            .header { background: #059669; color: white; padding: 18px 24px; border-radius: 10px 10px 0 0; }
            .content { background: white; padding: 28px 24px; border-radius: 0 0 10px 10px; }
            .badge { display:inline-block; background:#d1fae5; color:#065f46; font-size:12px; font-weight:700;
                     padding:3px 10px; border-radius:20px; margin-bottom:16px; }
            .field { margin-bottom:16px; }
            .field label { display:block; font-size:11px; font-weight:700; color:#6b7280;
                           text-transform:uppercase; letter-spacing:.05em; margin-bottom:4px; }
            .field p { background:#f9fafb; border:1px solid #e5e7eb; border-radius:8px;
                       padding:10px 14px; margin:0; font-size:14px; }
            .message-box { background:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px;
                           padding:14px; white-space:pre-wrap; font-size:14px; }
            .footer { text-align:center; margin-top:20px; color:#9ca3af; font-size:11px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 style="margin:0;font-size:18px;">💬 Tin nhắn liên hệ mới</h2>
              <p style="margin:4px 0 0;opacity:.85;font-size:13px;">${time}</p>
            </div>
            <div class="content">
              <span class="badge">● Chưa đọc</span>
              <div class="field"><label>Người gửi</label><p>${name}</p></div>
              <div class="field"><label>Email</label><p><a href="mailto:${email}" style="color:#059669;">${email}</a></p></div>
              <div class="field"><label>Tiêu đề</label><p>${subject}</p></div>
              <div class="field">
                <label>Nội dung</label>
                <div class="message-box">${message}</div>
              </div>
              <p style="margin-top:20px;font-size:13px;color:#6b7280;">
                Trả lời trực tiếp email này để phản hồi <strong>${name}</strong>.
              </p>
            </div>
            <div class="footer">Finance Manager · System Notification · Không trả lời email tự động này</div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Contact notification sent to admin:', info.messageId);
    return { success: true, mode: 'email', messageId: info.messageId };
  } catch (error) {
    console.error('❌ Contact admin email error:', error);
    return { success: false, error: error.message };
  }
};

// ─── Gửi email xác nhận cho người gửi ──────────────────────────────────────
export const sendContactConfirmationToUser = async ({ name, email, subject }) => {
  try {
    if (!isEmailConfigured()) {
      console.log('📩 [Contact confirm - demo mode]', email);
      return { success: true, mode: 'demo' };
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: `"Finance Manager" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Chúng tôi đã nhận được tin nhắn của bạn – Finance Manager',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f8fafc; }
            .header { background: #059669; color: white; padding: 20px 24px; border-radius: 10px 10px 0 0; text-align:center; }
            .content { background: white; padding: 30px 24px; border-radius: 0 0 10px 10px; }
            .check { width:56px;height:56px;background:#d1fae5;border-radius:50%;display:flex;
                     align-items:center;justify-content:center;margin:0 auto 16px;font-size:26px;text-align:center; }
            .info-box { background:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px; padding:14px 18px; margin:20px 0; }
            .footer { text-align:center; margin-top:24px; color:#9ca3af; font-size:11px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin:0;font-size:20px;">💰 Finance Manager</h1>
            </div>
            <div class="content">
              <div class="check">✅</div>
              <h2 style="text-align:center;margin:0 0 8px;">Đã nhận tin nhắn!</h2>
              <p style="text-align:center;color:#6b7280;margin:0 0 20px;">Cảm ơn bạn đã liên hệ với chúng tôi.</p>

              <p>Xin chào <strong>${name}</strong>,</p>
              <p>Chúng tôi đã nhận được tin nhắn của bạn về chủ đề: <strong>"${subject}"</strong>.</p>

              <div class="info-box">
                <p style="margin:0;font-size:14px;">
                  ⏰ Đội ngũ hỗ trợ của chúng tôi sẽ phản hồi trong vòng <strong>24 giờ làm việc</strong>
                  (Thứ 2 – Thứ 6, 8:00 – 17:30).
                </p>
              </div>

              <p style="font-size:14px;color:#6b7280;">
                Trong thời gian chờ, bạn có thể xem phần <strong>Câu hỏi thường gặp</strong>
                trên trang web của chúng tôi.
              </p>

              <p>Trân trọng,<br><strong>Finance Manager Support Team</strong></p>
            </div>
            <div class="footer">
              <p>Email này được gửi tự động. Vui lòng không trả lời trực tiếp email này.</p>
              <p style="margin:4px 0;">Liên hệ: support@financemanager.vn</p>
              <p>&copy; 2025 Finance Manager. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Confirmation email sent to user:', info.messageId);
    return { success: true, mode: 'email', messageId: info.messageId };
  } catch (error) {
    console.error('❌ Contact confirm email error:', error);
    return { success: false, error: error.message };
  }
};

// Gửi email chào mừng (optional)
export const sendWelcomeEmail = async (email, userName) => {
  try {
    // Nếu email chưa được cấu hình, bỏ qua
    if (!isEmailConfigured()) {
      console.log('⚠️  Email chưa được cấu hình. Bỏ qua gửi email chào mừng.');
      return { success: true, mode: 'demo' };
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: `"Finance Manager" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Chào mừng đến với Finance Manager! 🎉',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f9f9f9;
            }
            .header {
              background-color: #0ea5e9;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background-color: white;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .feature {
              padding: 10px;
              margin: 10px 0;
              background-color: #f0f9ff;
              border-radius: 5px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💰 Finance Manager</h1>
            </div>
            <div class="content">
              <h2>Chào mừng ${userName}!</h2>
              <p>Cảm ơn bạn đã đăng ký tài khoản Finance Manager.</p>
              
              <p>Với ứng dụng của chúng tôi, bạn có thể:</p>
              <div class="feature">✅ Quản lý thu chi cá nhân</div>
              <div class="feature">📊 Xem thống kê và biểu đồ</div>
              <div class="feature">💰 Theo dõi số dư tài khoản</div>
              <div class="feature">🎯 Đặt ngân sách hàng tháng</div>
              
              <p>Bắt đầu thêm giao dịch đầu tiên của bạn ngay hôm nay!</p>
              
              <p>Trân trọng,<br><strong>Finance Manager Team</strong></p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Welcome email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email error:', error);
    return { success: false, error: error.message };
  }
};
