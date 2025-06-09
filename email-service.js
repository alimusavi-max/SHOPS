const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');

class EmailService {
  constructor() {
    // Create transporter based on environment
    if (process.env.NODE_ENV === 'production') {
      // Production configuration (e.g., SendGrid, Mailgun)
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
    } else {
      // Development configuration (Mailtrap)
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.mailtrap.io',
        port: process.env.EMAIL_PORT || 2525,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
    }
  }

  // Load and compile template
  async loadTemplate(templateName, context) {
    const templatePath = path.join(__dirname, '../templates/emails', `${templateName}.hbs`);
    const templateSource = await fs.readFile(templatePath, 'utf-8');
    const template = handlebars.compile(templateSource);
    return template(context);
  }

  // Send email
  async send(options) {
    try {
      // Get HTML from template if provided
      let html = options.html;
      if (options.template && options.context) {
        html = await this.loadTemplate(options.template, options.context);
      }

      // Email options
      const mailOptions = {
        from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
        to: options.email,
        subject: options.subject,
        text: options.text,
        html
      };

      // Send email
      const info = await this.transporter.sendMail(mailOptions);
      
      console.log(`Email sent: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error('Email sending error:', error);
      throw error;
    }
  }

  // Email templates
  async sendWelcomeEmail(user) {
    await this.send({
      email: user.email,
      subject: 'به فروشگاه آنلاین خوش آمدید',
      template: 'welcome',
      context: {
        name: user.name,
        loginUrl: `${process.env.CLIENT_URL}/login`
      }
    });
  }

  async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    
    await this.send({
      email: user.email,
      subject: 'بازیابی رمز عبور - فروشگاه آنلاین',
      template: 'passwordReset',
      context: {
        name: user.name,
        resetUrl,
        validMinutes: 30
      }
    });
  }

  async sendEmailVerification(user, verifyToken) {
    const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${verifyToken}`;
    
    await this.send({
      email: user.email,
      subject: 'تایید ایمیل - فروشگاه آنلاین',
      template: 'emailVerification',
      context: {
        name: user.name,
        verifyUrl
      }
    });
  }

  async sendOrderConfirmation(order, user) {
    await this.send({
      email: user.email,
      subject: `تایید سفارش #${order.orderNumber}`,
      template: 'orderConfirmation',
      context: {
        name: user.name,
        orderNumber: order.orderNumber,
        items: order.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: this.formatPrice(item.finalPrice),
          total: this.formatPrice(item.finalPrice * item.quantity)
        })),
        subtotal: this.formatPrice(order.subtotal),
        discount: this.formatPrice(order.totalDiscount),
        shipping: this.formatPrice(order.shippingCost),
        total: this.formatPrice(order.totalAmount),
        shippingAddress: order.shippingAddress,
        trackingUrl: `${process.env.CLIENT_URL}/orders/${order._id}`
      }
    });
  }

  async sendOrderStatusUpdate(order, user, newStatus) {
    const statusMessages = {
      processing: 'سفارش شما در حال پردازش است',
      packaged: 'سفارش شما بسته‌بندی شد',
      shipped: 'سفارش شما ارسال شد',
      delivered: 'سفارش شما تحویل داده شد',
      cancelled: 'سفارش شما لغو شد',
      returned: 'سفارش شما مرجوع شد'
    };

    await this.send({
      email: user.email,
      subject: `بروزرسانی وضعیت سفارش #${order.orderNumber}`,
      template: 'orderStatusUpdate',
      context: {
        name: user.name,
        orderNumber: order.orderNumber,
        status: statusMessages[newStatus],
        trackingCode: order.trackingCode,
        trackingUrl: `${process.env.CLIENT_URL}/orders/${order._id}`
      }
    });
  }

  async sendLowStockAlert(product, adminEmail) {
    await this.send({
      email: adminEmail,
      subject: `هشدار موجودی کم - ${product.name}`,
      template: 'lowStockAlert',
      context: {
        productName: product.name,
        currentStock: product.stock.quantity,
        productUrl: `${process.env.CLIENT_URL}/admin/products/${product._id}`
      }
    });
  }

  async sendNewReviewNotification(review, product, adminEmail) {
    await this.send({
      email: adminEmail,
      subject: 'نظر جدید ثبت شد',
      template: 'newReview',
      context: {
        productName: product.name,
        reviewerName: review.user.name,
        rating: review.rating,
        comment: review.comment,
        reviewUrl: `${process.env.CLIENT_URL}/admin/reviews/${review._id}`
      }
    });
  }

  async sendPriceDropNotification(user, product, oldPrice) {
    await this.send({
      email: user.email,
      subject: `کاهش قیمت - ${product.name}`,
      template: 'priceDrop',
      context: {
        name: user.name,
        productName: product.name,
        oldPrice: this.formatPrice(oldPrice),
        newPrice: this.formatPrice(product.finalPrice),
        discount: product.discount,
        productUrl: `${process.env.CLIENT_URL}/products/${product._id}`
      }
    });
  }

  async sendBackInStockNotification(user, product) {
    await this.send({
      email: user.email,
      subject: `موجود شد - ${product.name}`,
      template: 'backInStock',
      context: {
        name: user.name,
        productName: product.name,
        price: this.formatPrice(product.finalPrice),
        productUrl: `${process.env.CLIENT_URL}/products/${product._id}`
      }
    });
  }

  // Helper method to format price
  formatPrice(price) {
    return new Intl.NumberFormat('fa-IR').format(price);
  }
}

// Create singleton instance
const emailService = new EmailService();

// Export main send function
module.exports = emailService.send.bind(emailService);

// Export specific email functions
module.exports.sendWelcomeEmail = emailService.sendWelcomeEmail.bind(emailService);
module.exports.sendPasswordResetEmail = emailService.sendPasswordResetEmail.bind(emailService);
module.exports.sendEmailVerification = emailService.sendEmailVerification.bind(emailService);
module.exports.sendOrderConfirmation = emailService.sendOrderConfirmation.bind(emailService);
module.exports.sendOrderStatusUpdate = emailService.sendOrderStatusUpdate.bind(emailService);
module.exports.sendLowStockAlert = emailService.sendLowStockAlert.bind(emailService);
module.exports.sendNewReviewNotification = emailService.sendNewReviewNotification.bind(emailService);
module.exports.sendPriceDropNotification = emailService.sendPriceDropNotification.bind(emailService);
module.exports.sendBackInStockNotification = emailService.sendBackInStockNotification.bind(emailService);