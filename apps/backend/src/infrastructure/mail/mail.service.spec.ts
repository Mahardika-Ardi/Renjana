import { Logger } from '@nestjs/common';
import { MailService } from './mail.service';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(),
}));

import * as nodemailer from 'nodemailer';

describe('MailService', () => {
  let service: MailService;
  let createTransportMock: jest.Mock;
  const logger = { log: jest.fn(), warn: jest.fn(), error: jest.fn() };

  beforeEach(() => {
    createTransportMock = nodemailer.createTransport as jest.Mock;
    createTransportMock.mockClear();

    jest.spyOn(Logger.prototype, 'log').mockImplementation(logger.log);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(logger.warn);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(logger.error);
    logger.log.mockClear();
    logger.warn.mockClear();
    logger.error.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const buildService = (mailConfig: Record<string, string | number>) => {
    const config = {
      get: jest.fn((key: string) => {
        const map: Record<string, any> = {
          'mail.host': 'smtp.gmail.com',
          'mail.port': 587,
          'mail.user': '',
          'mail.pass': '',
          'mail.fromName': 'Renjana',
          ...mailConfig,
        };
        return map[key];
      }),
    };
    return new MailService(config as any);
  };

  describe('constructor', () => {
    it('should not create transporter when credentials missing', () => {
      buildService({ 'mail.user': '', 'mail.pass': '' });
      expect(createTransportMock).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('MAIL_USERNAME/MAIL_PASSWORD'),
      );
    });

    it('should create transporter when credentials present', () => {
      createTransportMock.mockReturnValue({ sendMail: jest.fn() });
      buildService({ 'mail.user': 'a@b.com', 'mail.pass': 'pass' });

      expect(createTransportMock).toHaveBeenCalledWith({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: { user: 'a@b.com', pass: 'pass' },
      });
      expect(logger.log).toHaveBeenCalledWith(
        expect.stringContaining('initialized for a@b.com'),
      );
    });
  });

  describe('sendMail', () => {
    it('should return false and skip when no transporter configured', async () => {
      service = buildService({ 'mail.user': '', 'mail.pass': '' });

      const result = await service.sendMail({
        to: 'x@test.com',
        subject: 'Test',
        html: '<p>Hi</p>',
      });

      expect(result).toBe(false);
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('dilewati'),
      );
    });

    it('should send mail and return true on success', async () => {
      const sendMail = jest
        .fn()
        .mockResolvedValue({ messageId: 'abc-123' });
      createTransportMock.mockReturnValue({ sendMail });
      service = buildService({ 'mail.user': 'a@b.com', 'mail.pass': 'pass' });

      const result = await service.sendMail({
        to: 'x@test.com',
        subject: 'Halo',
        html: '<p>Hi</p>',
      });

      expect(sendMail).toHaveBeenCalledWith({
        from: '"Renjana" <a@b.com>',
        to: 'x@test.com',
        subject: 'Halo',
        html: '<p>Hi</p>',
      });
      expect(result).toBe(true);
      expect(logger.log).toHaveBeenCalledWith(
        expect.stringContaining('ID: abc-123'),
      );
    });

    it('should return false when transporter throws', async () => {
      createTransportMock.mockReturnValue({
        sendMail: jest.fn().mockRejectedValue(new Error('SMTP down')),
      });
      service = buildService({ 'mail.user': 'a@b.com', 'mail.pass': 'pass' });

      const result = await service.sendMail({
        to: 'x@test.com',
        subject: 'Halo',
        html: '<p>Hi</p>',
      });

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('SMTP down'),
        expect.any(String),
      );
    });
  });
});