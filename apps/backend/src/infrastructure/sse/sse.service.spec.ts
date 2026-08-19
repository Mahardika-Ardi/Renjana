import { SseService } from './sse.service';

describe('SseService', () => {
  let service: SseService;

  beforeEach(() => {
    service = new SseService();
    jest.clearAllMocks();
  });

  describe('subscribe', () => {
    it('should return an observable that receives emitted events', (done) => {
      const observable = service.subscribe('couple-1');
      const subscription = observable.subscribe({
        next: (value) => {
          expect(value).toEqual({
            type: 'todo.created',
            data: JSON.stringify({ id: 't-1' }),
          });
          subscription.unsubscribe();
          done();
        },
      });

      service.emit('couple-1', 'todo.created', { id: 't-1' });
    });

    it('should not deliver events to subscribers of other couples', (done) => {
      const observable = service.subscribe('couple-2');
      let received = false;

      const subscription = observable.subscribe(() => {
        received = true;
      });

      service.emit('couple-3', 'todo.created', {});

      setTimeout(() => {
        expect(received).toBe(false);
        subscription.unsubscribe();
        done();
      }, 10);
    });

    it('should clean up subscriber on unsubscribe', () => {
      const observable = service.subscribe('couple-1');
      const subscription = observable.subscribe({ next: () => {} });
      subscription.unsubscribe();

      expect((service as any).subscribers.has('couple-1')).toBe(false);
    });
  });

  describe('emit', () => {
    it('should be a no-op when no subscribers for a couple', () => {
      expect(() => service.emit('couple-9', 'run.created', {})).not.toThrow();
    });
  });
});