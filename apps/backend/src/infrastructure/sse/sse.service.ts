import { Injectable, Logger } from '@nestjs/common';
import { Subject, Observable, interval, merge, map } from 'rxjs';

export interface SseEvent {
  event: string;
  data: any;
}

@Injectable()
export class SseService {
  private readonly logger = new Logger(SseService.name);
  // ponytail: In-memory registry for SSE subjects. Scale to Redis PubSub if multi-instance.
  private readonly subscribers = new Map<string, Set<Subject<SseEvent>>>();

  /**
   * Subscribe to real-time SSE events for a specific couple
   */
  subscribe(coupleId: string): Observable<any> {
    if (!this.subscribers.has(coupleId)) {
      this.subscribers.set(coupleId, new Set());
    }

    const subject = new Subject<SseEvent>();
    const coupleSubscribers = this.subscribers.get(coupleId)!;
    coupleSubscribers.add(subject);

    this.logger.log(
      `New SSE client connected for coupleId: ${coupleId} (Total subscribers: ${coupleSubscribers.size})`,
    );

    // 25-second heartbeat to prevent proxy timeout
    const heartbeat$ = interval(25_000).pipe(
      map(() => ({
        type: 'ping',
        data: JSON.stringify({ timestamp: new Date().toISOString() }),
      })),
    );

    const event$ = subject.asObservable().pipe(
      map((e) => ({
        type: e.event,
        data: JSON.stringify(e.data),
      })),
    );

    return new Observable((subscriber) => {
      const subscription = merge(event$, heartbeat$).subscribe(subscriber);

      return () => {
        subscription.unsubscribe();
        coupleSubscribers.delete(subject);
        if (coupleSubscribers.size === 0) {
          this.subscribers.delete(coupleId);
        }
        this.logger.log(`SSE client disconnected for coupleId: ${coupleId}`);
      };
    });
  }

  /**
   * Emit an event to all connected clients belonging to a couple
   */
  emit(coupleId: string, event: string, data: any): void {
    const coupleSubscribers = this.subscribers.get(coupleId);
    if (!coupleSubscribers || coupleSubscribers.size === 0) return;

    this.logger.log(
      `Emitting SSE event '${event}' to ${coupleSubscribers.size} subscribers (coupleId: ${coupleId})`,
    );
    for (const subject of coupleSubscribers) {
      subject.next({ event, data });
    }
  }
}
