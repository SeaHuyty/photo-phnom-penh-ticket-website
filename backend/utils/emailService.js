import nodemailer from 'nodemailer';
import QRCode from 'qrcode';
import CryptoJS from 'crypto-js';
import dotenv from 'dotenv';

dotenv.config();

// QR Code Security Functions
const QR_SECRET_KEY = process.env.QR_SECRET_KEY;

const hashQRData = (originalData) => {
  try {
    const hash = CryptoJS.HmacSHA256(originalData, QR_SECRET_KEY).toString();
    return hash;
  } catch (error) {
    console.error('Error hashing QR data:', error);
    return originalData;
  }
};

// Create transporter for sending emails
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Generate QR code as buffer
const generateQRCodeBuffer = async (qrCodeData) => {
  try {
    // Hash the QR code data before generating
    const hashedQRData = hashQRData(qrCodeData);
    
    // Generate QR code as buffer
    const qrBuffer = await QRCode.toBuffer(hashedQRData, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    return qrBuffer;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
};

// Send email with QR code attachment(s)
export const sendTicketEmail = async (userInfo, tickets) => {
  try {
    const transporter = createTransporter();
    
    // Verify transporter configuration
    await transporter.verify();
    console.log('Email transporter verified successfully');
    
    // Prepare attachments array
    const attachments = [];
    
    // Generate QR codes for each ticket
    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i];
      const qrBuffer = await generateQRCodeBuffer(ticket.qrCode);
      
      const fileName = tickets.length > 1 
        ? `ticket_${i + 1}_qrcode.png`
        : 'ticket_qrcode.png';
      
      attachments.push({
        filename: fileName,
        content: qrBuffer,
        contentType: 'image/png'
      });
    }
    
    // Prepare email content
    const ticketWord = tickets.length === 1 ? 'ticket' : 'tickets';
    const eventName = userInfo.event?.name || 'Unknown Event';
    
    const emailSubject = `16th Photo Phnom Penh Festival: ${eventName} ${ticketWord.charAt(0).toUpperCase() + ticketWord.slice(1)}`;
    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; border-bottom: 2px solid #BC2649; padding-bottom: 20px; margin-bottom: 30px;">
          <h1 style="color: #BC2649; margin: 0;">Photo Phnom Penh Festival</h1>
          <h2 style="color: #333; margin: 10px 0 0 0;">Ticket Confirmation</h2>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #BC2649; margin-top: 0;">Hello ${userInfo.name}!</h3>
          <p style="color: #333; line-height: 1.6;">
            Thank you for registering for <strong>${eventName}</strong>. 
            Your ${ticketWord} ${tickets.length === 1 ? 'is' : 'are'} ready!
          </p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h4 style="color: #333;">Event Details:</h4>
          <ul style="color: #666; line-height: 1.8;">
            <li><strong>Event:</strong> ${eventName}</li>
            <li><strong>Name:</strong> ${userInfo.name}</li>
            <li><strong>Email:</strong> ${userInfo.email}</li>
            <li><strong>Phone:</strong> ${userInfo.phone}</li>
            <li><strong>Number of Tickets:</strong> ${tickets.length}</li>
          </ul>
        </div>
        
        <div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; border-left: 4px solid #2196F3; margin-bottom: 20px;">
          <h4 style="color: #1976D2; margin-top: 0;">Important Instructions:</h4>
          <ul style="color: #333; line-height: 1.6; margin: 0;">
            <li>Please bring your QR code${tickets.length > 1 ? 's' : ''} to the event</li>
            <li>Show the QR code${tickets.length > 1 ? 's' : ''} to our staff for scanning</li>
            <li>Each QR code can only be used once</li>
            <li>Save this email or download the attachment${tickets.length > 1 ? 's' : ''}</li>
          </ul>
        </div>
        
        ${tickets.length > 1 ? `
        <div style="margin-bottom: 20px;">
          <h4 style="color: #333;">Your Tickets:</h4>
          <ul style="color: #666; line-height: 1.6;">
            ${tickets.map((ticket, index) => `
              <li>Ticket ${index + 1}: ID ${ticket.id}</li>
            `).join('')}
          </ul>
        </div>
        ` : `
        <div style="margin-bottom: 20px;">
          <h4 style="color: #333;">Your Ticket:</h4>
          <p style="color: #666;">Ticket ID: ${tickets[0].id}</p>
        </div>
        `}
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
          <p style="color: #888; font-size: 14px;">
            If you have any questions, please contact our support team.<br>
            We look forward to seeing you at the event!
          </p>
          <p style="color: #BC2649; font-weight: bold; margin: 0;">Photo Phnom Penh Festival Team</p>
        </div>
      </div>
    `;
    
    const emailText = `
Hello ${userInfo.name}!

Thank you for registering for ${eventName}. Your ${ticketWord} ${tickets.length === 1 ? 'is' : 'are'} ready!

Event Details:
- Event: ${eventName}
- Name: ${userInfo.name}
- Email: ${userInfo.email}
- Phone: ${userInfo.phone}
- Number of Tickets: ${tickets.length}

${tickets.length > 1 ? 
  `Your Tickets:\n${tickets.map((ticket, index) => `- Ticket ${index + 1}: ID ${ticket.id}`).join('\n')}` :
  `Your Ticket: ID ${tickets[0].id}`
}

Important Instructions:
- Please bring your QR code${tickets.length > 1 ? 's' : ''} to the event
- Show the QR code${tickets.length > 1 ? 's' : ''} to our staff for scanning
- Each QR code can only be used once
- Save this email or download the attachment${tickets.length > 1 ? 's' : ''}

If you have any questions, please contact our support team.
We look forward to seeing you at the event!

Photo Phnom Penh Festival Team
    `;
    
    // Mail options
    const mailOptions = {
      from: {
        name: process.env.EMAIL_FROM_NAME || 'Phnom Penh Festival',
        address: process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER
      },
      to: userInfo.email,
      subject: emailSubject,
      text: emailText,
      html: emailHtml,
      attachments: attachments
    };
    
    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    
    return {
      success: true,
      messageId: info.messageId,
      message: `Email sent successfully to ${userInfo.email} with ${tickets.length} QR code${tickets.length > 1 ? 's' : ''}`
    };
    
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to send email'
    };
  }
};

export default { sendTicketEmail };