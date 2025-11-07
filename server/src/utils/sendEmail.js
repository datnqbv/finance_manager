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
