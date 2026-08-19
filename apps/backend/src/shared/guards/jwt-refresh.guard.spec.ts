import { JwtRefreshGuard } from './jwt-refresh.guard';

describe('JwtRefreshGuard', () => {
  it('should be an instance with jwt-refresh strategy', () => {
    const guard = new JwtRefreshGuard();
    expect(guard).toBeDefined();
  });
});