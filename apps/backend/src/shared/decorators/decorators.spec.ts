import 'reflect-metadata';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { Public, IS_PUBLIC_KEY } from './public.decorator';
import { CurrentUser } from './current-user.decorator';

function getParamFactory(decorator: (data?: any) => any): any {
  class TestController {
    test(@decorator() value: any) {}
  }
  const metadata = Reflect.getMetadata(
    ROUTE_ARGS_METADATA,
    TestController,
    'test',
  );
  const key = Object.keys(metadata)[0];
  return metadata[key].factory;
}

describe('decorators', () => {
  describe('Public', () => {
    it('should set isPublic metadata to true', () => {
      class TestController {
        @Public()
        method() {}
      }

      const metadata = Reflect.getMetadata(
        IS_PUBLIC_KEY,
        TestController.prototype.method,
      );
      expect(metadata).toBe(true);
    });
  });

  describe('CurrentUser', () => {
    const request = { user: { id: 'u-1', email: 'a@test.com', name: 'Andi' } };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as any;

    it('should return full user when no data key provided', () => {
      const factory = getParamFactory(CurrentUser);
      const result = factory(undefined, context);
      expect(result).toEqual(request.user);
    });

    it('should return specific field when data key provided', () => {
      const factory = getParamFactory(CurrentUser);
      const result = factory('id', context);
      expect(result).toBe('u-1');
    });

    it('should return undefined for missing field', () => {
      const factory = getParamFactory(CurrentUser);
      const result = factory('avatarUrl', context);
      expect(result).toBeUndefined();
    });
  });
});