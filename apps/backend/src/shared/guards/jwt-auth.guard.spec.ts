import { JwtAuthGuard } from './jwt-auth.guard';
import { IS_PUBLIC_KEY } from '../decorators';

jest.mock('@nestjs/passport', () => ({
  AuthGuard: (type: string) =>
    class MockPassportGuard {
      async canActivate() {
        return Promise.resolve(true);
      }
    },
}));

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: any;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    };
    guard = new JwtAuthGuard(reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should bypass auth when route is marked public', () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    const context: any = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
    };

    const result = guard.canActivate(context);

    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    expect(result).toBe(true);
  });

  it('should defer to passport strategy when not public', () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const parentProto = Object.getPrototypeOf(JwtAuthGuard.prototype);
    const spy = jest.spyOn(parentProto, 'canActivate').mockReturnValue(true as any);

    const context: any = { getHandler: jest.fn(), getClass: jest.fn() };
    const result = guard.canActivate(context);

    expect(spy).toHaveBeenCalledWith(context);
    expect(result).toBe(true);
    spy.mockRestore();
  });
});