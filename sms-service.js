const axios = require('axios');

class SMSService {
  constructor() {
    this.apiKey = process.env.KAVENEGAR_API_KEY;
    this.baseURL = `https://api.kavenegar.com/v1/${this.apiKey}`;
    this.sender = process.env.SMS_SENDER || '10004346';
  }

  // Send single SMS
  async send(receptor, message) {
    try {
      const response = await axios.post(
        `${this.baseURL}/sms/send.json`,
        null,
        {
          params: {
            receptor,
            message,
            sender: this.sender
          }
        }
      );

      if (response.data.return.status === 200) {
        console.log(`SMS sent successfully to ${receptor}`);
        return {
          success: true,
          messageId: response.data.entries[0].messageid,
          status: response.data.entries[0].status
        };
      } else {
        throw new Error(response.data.return.message);
      }
    } catch (error) {
      console.error('SMS sending error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Send OTP using template
  async sendOTP(receptor, token) {
    try {
      const template = process.env.KAVENEGAR_OTP_TEMPLATE || 'verify';
      
      const response = await axios.post(
        `${this.baseURL}/verify/lookup.json`,
        null,
        {
          params: {
            receptor,
            token,
            template
          }
        }
      );

      if (response.data.return.status === 200) {
        console.log(`OTP sent successfully to ${receptor}`);
        return {
          success: true,
          messageId: response.data.entries[0].messageid
        };
      } else {
        throw new Error(response.data.return.message);
      }
    } catch (error) {
      console.error('OTP sending error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Send using template with multiple tokens
  async sendTemplate(receptor, template, tokens) {
    try {
      const params = {
        receptor,
        template,
        ...tokens
      };

      const response = await axios.post(
        `${this.baseURL}/verify/lookup.json`,
        null,
        { params }
      );

      if (response.data.return.status === 200) {
        return {
          success: true,
          messageId: response.data.entries[0].messageid
        };
      } else {
        throw new Error(response.data.return.message);
      }
    } catch (error) {
      console.error('Template SMS error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Check delivery status
  async checkStatus(messageId) {
    try {
      const response = await axios.post(
        `${this.baseURL}/sms/status.json`,
        null,
        {
          params: {
            messageid: messageId
          }
        }
      );

      if (response.data.return.status === 200) {
        return {
          success: true,
          status: response.data.entries[0].status,
          statusText: this.getStatusText(response.data.entries[0].status)
        };
      } else {
        throw new Error(response.data.return.message);
      }
    } catch (error) {
      console.error('Status check error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Get status text in Persian
  getStatusText(status) {
    const statusMap = {
      1: 'در صف ارسال',
      2: 'ارسال شده به مخابرات',
      4: 'ارسال شده به گوشی',
      5: 'ارسال نشده به مخابرات',
      6: 'ارسال نشده به گوشی',
      8: 'رسیده به گوشی',
      10: 'نرسیده به گوشی',
      11: 'در لیست سیاه',
      13: 'لغو شده',
      14: 'بلاک شده'
    };
    return statusMap[status] || 'نامشخص';
  }

  // SMS Templates
  async sendWelcomeSMS(phone, name) {
    const message = `${name} عزیز، به فروشگاه آنلاین خوش آمدید! 🎉\nبرای مشاهده محصولات ویژه به سایت ما مراجعه کنید.`;
    return this.send(phone, message);
  }

  async sendOrderConfirmationSMS(phone, orderNumber, amount) {
    return this.sendTemplate(phone, 'orderConfirmation', {
      token: orderNumber,
      token2: this.formatPrice(amount)
    });
  }

  async sendOrderShippedSMS(phone, orderNumber, trackingCode) {
    return this.sendTemplate(phone, 'orderShipped', {
      token: orderNumber,
      token2: trackingCode
    });
  }

  async sendOrderDeliveredSMS(phone, orderNumber) {
    const message = `سفارش شما با شماره ${orderNumber} تحویل داده شد.\nاز خرید شما متشکریم. 🙏`;
    return this.send(phone, message);
  }

  async sendPaymentConfirmationSMS(phone, amount, refId) {
    return this.sendTemplate(phone, 'paymentSuccess', {
      token: this.formatPrice(amount),
      token2: refId
    });
  }

  async sendPriceDropSMS(phone, productName, newPrice) {
    const message = `🎯 کاهش قیمت!\n${productName}\nقیمت جدید: ${this.formatPrice(newPrice)} تومان\nهمین حالا خرید کنید!`;
    return this.send(phone, message);
  }

  async sendLowStockSMS(adminPhone, productName, stock) {
    const message = `⚠️ هشدار موجودی\nمحصول: ${productName}\nموجودی فعلی: ${stock} عدد\nلطفا نسبت به تامین موجودی اقدام کنید.`;
    return this.send(adminPhone, message);
  }

  // Helper method to format price
  formatPrice(price) {
    return new Intl.NumberFormat('fa-IR').format(price);
  }

  // Batch SMS sending
  async sendBatch(messages) {
    try {
      // Prepare batch data
      const receptor = messages.map(m => m.phone).join(',');
      const message = messages.map(m => m.message).join(',,,');

      const response = await axios.post(
        `${this.baseURL}/sms/sendarray.json`,
        null,
        {
          params: {
            receptor,
            message,
            sender: this.sender
          }
        }
      );

      if (response.data.return.status === 200) {
        return {
          success: true,
          results: response.data.entries
        };
      } else {
        throw new Error(response.data.return.message);
      }
    } catch (error) {
      console.error('Batch SMS error:', error.response?.data || error.message);
      throw error;
    }
  }
}

// OTP management with Redis (optional)
class OTPManager {
  constructor(redisClient) {
    this.redis = redisClient;
    this.smsService = new SMSService();
    this.otpExpiry = 120; // 2 minutes
    this.maxAttempts = 5;
  }

  // Generate OTP
  generateOTP(length = 6) {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
      otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
  }

  // Send OTP
  async sendOTP(phone) {
    const otp = this.generateOTP();
    const key = `otp:${phone}`;
    const attemptsKey = `otp_attempts:${phone}`;

    // Check attempts
    const attempts = await this.redis.get(attemptsKey) || 0;
    if (attempts >= this.maxAttempts) {
      throw new Error('تعداد تلاش‌های شما بیش از حد مجاز است. لطفا بعدا تلاش کنید.');
    }

    // Store OTP in Redis
    await this.redis.setex(key, this.otpExpiry, otp);
    await this.redis.incr(attemptsKey);
    await this.redis.expire(attemptsKey, 3600); // Reset attempts after 1 hour

    // Send SMS
    await this.smsService.sendOTP(phone, otp);

    return {
      success: true,
      expiresIn: this.otpExpiry
    };
  }

  // Verify OTP
  async verifyOTP(phone, inputOTP) {
    const key = `otp:${phone}`;
    const storedOTP = await this.redis.get(key);

    if (!storedOTP) {
      return {
        valid: false,
        error: 'کد تایید منقضی شده یا وجود ندارد'
      };
    }

    if (storedOTP === inputOTP) {
      // Delete OTP after successful verification
      await this.redis.del(key);
      await this.redis.del(`otp_attempts:${phone}`);
      
      return {
        valid: true
      };
    }

    return {
      valid: false,
      error: 'کد تایید اشتباه است'
    };
  }
}

// Create singleton instance
const smsService = new SMSService();

// Export service
module.exports = smsService;
module.exports.OTPManager = OTPManager;