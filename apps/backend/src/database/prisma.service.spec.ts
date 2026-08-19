import { PrismaService } from './prisma.service';

jest.mock('@prisma/client', () => {
  class PrismaClientMock {
    $connect = jest.fn();
    $disconnect = jest.fn();
  }
  return { PrismaClient: PrismaClientMock };
});

describe('PrismaService', () => {
  let prismaService: PrismaService;

  beforeEach(() => {
    prismaService = new PrismaService();
  });

  it('should connect on module init', async () => {
    await prismaService.onModuleInit();
    expect(prismaService.$connect).toHaveBeenCalled();
  });

  it('should disconnect on module destroy', async () => {
    await prismaService.onModuleDestroy();
    expect(prismaService.$disconnect).toHaveBeenCalled();
  });
});