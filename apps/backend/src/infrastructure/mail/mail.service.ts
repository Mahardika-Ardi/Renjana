import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private readonly fromName: string;
  private readonly fromAddress: string;

  constructor(private config: ConfigService) {
    const host = this.config.get<string>('mail.host') || 'smtp.gmail.com';
    const port = this.config.get<number>('mail.port') || 587;
    const user = this.config.get<string>('mail.user') || '';
    const pass = this.config.get<string>('mail.pass') || '';
    this.fromName = this.config.get<string>('mail.fromName') || 'Renjana';
    this.fromAddress = user;

    // ponytail: graceful degradation if SMTP credentials missing in dev
    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: false, // STARTTLS for Gmail on port 587
        auth: { user, pass },
      });
      this.logger.log(`MailService (SMTP) initialized for ${user}`);
    } else {
      this.logger.warn(
        'MAIL_USERNAME/MAIL_PASSWORD belum dikonfigurasi di .env. Pengiriman email akan dilewati.',
      );
    }
  }

  async sendMail(options: SendMailOptions): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn(
        `Pengiriman email ke ${options.to} dilewati: SMTP credentials belum dikonfigurasi.`,
      );
      return false;
    }

    try {
      const info = await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromAddress}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });

      this.logger.log(
        `Email berhasil dikirim ke ${options.to} (ID: ${info.messageId})`,
      );
      return true;
    } catch (err: any) {
      this.logger.error(
        `Gagal mengirim email ke ${options.to}: ${err.message}`,
        err.stack,
      );
      return false;
    }
  }
}
