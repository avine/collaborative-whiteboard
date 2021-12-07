import { BehaviorSubject, combineLatest, Subject } from 'rxjs';
import { first, map } from 'rxjs/operators';

import { Injectable } from '@angular/core';

import { CutRange, CutRangeArg, DrawEvent, DrawEventsBroadcast, DrawTransport, Owner } from './cw.model';
import { drawEventsBroadcastMapper, getClearEvent, getHash, normalizeCutRange } from './cw.operator';

@Injectable()
export class CwService {
  private historyMap = new Map<string, DrawEvent>();

  private historyRedo: DrawEvent[][] = [];

  private history$$ = new BehaviorSubject<DrawEvent[]>([]);

  private cutRange: CutRange = [0, 0];

  private cutRange$$ = new BehaviorSubject<CutRange>(this.cutRange);

  /**
   * Dispatch draw events from the server to the client
   */
  private broadcast$$ = new Subject<DrawEventsBroadcast>();

  /**
   * Dispatch draw events from the client to the server
   */
  private emit$$ = new Subject<DrawTransport>();

  history$ = this.history$$.asObservable();

  historyCut$ = this.history$$.pipe(map((history) => this.getOwnerDrawEvents(history)));

  historyCutLength$ = this.historyCut$.pipe(map((historyCut) => historyCut.length));

  cutRange$ = this.cutRange$$.asObservable();

  broadcastHistoryCut$ = combineLatest([this.historyCut$, this.cutRange$$]).pipe(
    map(([historyCut, [from, to]]) => {
      const slice = [getClearEvent(), ...historyCut.slice(from, to + 1)];
      return drawEventsBroadcastMapper(slice);
    })
  );

  broadcast$ = this.broadcast$$.asObservable();

  emit$ = this.emit$$.asObservable();

  owner!: Owner;

  constructor() {}

  private pushHistory(event: DrawEvent) {
    if ('options' in event) {
      event.options = { ...event.options }; // Make this immutable!
    }
    const hash = getHash(event);
    this.historyMap.set(hash, event);
  }

  private pullHistory(event: DrawEvent): boolean {
    const hash = getHash(event);
    return this.historyMap.delete(hash);
  }

  private popHistory(hash = this.getOwnerLastHash()): DrawEvent | void {
    if (hash) {
      const removed = this.historyMap.get(hash);
      if (removed) {
        this.historyMap.delete(hash);
        return removed;
      }
    }
  }

  private pushHistoryRedo(events: DrawEvent[]) {
    this.historyRedo.unshift(events);
  }

  private popHistoryRedo() {
    return this.historyRedo.shift();
  }

  private dropHistoryRedoAgainst(events: DrawEvent[]) {
    let redos: DrawEvent[] = [];
    events.forEach((event) => {
      const hash = getHash(event);
      while (redos.length || this.historyRedo.length) {
        if (!redos.length) {
          redos = this.historyRedo.shift() || []; // redos = this.popHistoryRedo(); // FIXME...
        }
        while (redos.length) {
          const redo = redos.shift();
          if (redo && getHash(redo) === hash) {
            // FIXME: Is there a bug ?
            // At this point we should do something like this, no?
            // But is this case really exists ?
            /*if (redos.length) {
              this.historyRedo.unshift(redos); // this.pushHistoryRedo(redos);
            }*/
            return;
          }
        }
      }
    });
  }

  private get history(): DrawEvent[] {
    return Array.from(this.historyMap.values());
  }

  private emitHistory() {
    this.history$$.next(this.history);
    this.checkCutRange();
  }

  private checkCutRange() {
    const [from, to] = this.cutRange;
    if (to >= this.history.length) {
      const lastIndex = this.history.length - 1;
      this.setCutRange([Math.min(from, lastIndex), lastIndex]);
    }
  }

  private setDrawEventOwner(event: DrawEvent): DrawEvent {
    return { ...event, owner: this.owner };
  }

  private getOwnerDrawEvents(events: DrawEvent[]) {
    return events.filter((event) => event.owner === this.owner);
  }

  private getOwnerLastHash(): string | void {
    for (const [hash, event] of this.historyMap.entries()) {
      if (event.owner === this.owner) {
        return hash;
      }
    }
  }

  private broadcastAdd(events: DrawEvent[]) {
    events = this.normalizeEvents(events);
    events.forEach((event) => this.pushHistory(event));
    const ownerEvents = this.getOwnerDrawEvents(events);
    if (ownerEvents.length) {
      this.dropHistoryRedoAgainst(ownerEvents);
    }
    this.broadcast$$.next(drawEventsBroadcastMapper(events, true));
    this.emitHistory();
  }

  private broadcastRemove(events: DrawEvent[]) {
    events = this.normalizeEvents(events);
    const removed = events.filter((event) => this.pullHistory(event));
    if (removed.length) {
      const ownerEvents = this.getOwnerDrawEvents(removed);
      if (ownerEvents.length) {
        this.pushHistoryRedo(ownerEvents);
      }
      this.broadcast$$.next(drawEventsBroadcastMapper([getClearEvent(), ...this.history]));
      this.emitHistory();
    }
  }

  // The clear event `data` should be: `[undefined, undefined, undefined, undefined]`.
  // But when stringified through the network it becomes: `[null, null, null, null]`.
  // Thus, we need to restore the real clear event data structure,
  // otherwise the method `CwCanvasComponent.drawClear` will not work properly...
  //
  // Note that since the whiteboard is collaborative, the clear event should NOT
  // be broadcast through the network, otherwise all users' events will be deleted.
  private normalizeEvents(events: DrawEvent[]) {
    return events.map((event) => (event.type === 'clear' ? getClearEvent() : event));
  }

  /**
   * Dispatch draw events from the server to the client
   */
  broadcast(transport: DrawTransport) {
    switch (transport.action) {
      case 'add':
        this.broadcastAdd(transport.events);
        break;
      case 'remove':
        this.broadcastRemove(transport.events);
        break;
      default:
        console.error('Unhandled "DrawTransport" event', transport);
        break;
    }
  }

  /**
   * Dispatch draw events from the client to the server
   */
  emit(event: DrawEvent) {
    event = this.setDrawEventOwner(event);
    this.pushHistory(event);
    this.dropHistoryRedoAgainst([event]);
    this.emit$$.next({ action: 'add', events: [event] });
    this.emitHistory();
  }

  undo() {
    const event = this.popHistory();
    if (event) {
      this.pushHistoryRedo([event]);
      this.broadcast$$.next(drawEventsBroadcastMapper([getClearEvent(), ...this.history]));
      this.emit$$.next({ action: 'remove', events: [event] });
      this.emitHistory();
    }
  }

  redo() {
    const events = this.popHistoryRedo();
    if (events) {
      events.forEach((event) => this.pushHistory(event));
      this.broadcast$$.next(drawEventsBroadcastMapper(events, true));
      this.emit$$.next({ action: 'add', events });
      this.emitHistory();
    }
  }

  cut(events: DrawEvent[]) {
    const removed = events.filter((event) => this.pullHistory(event));
    if (removed.length) {
      this.pushHistoryRedo(removed);
      this.broadcast$$.next(drawEventsBroadcastMapper([getClearEvent(), ...this.history]));
      this.emit$$.next({ action: 'remove', events: removed });
      this.emitHistory();
    }
  }

  /**
   * @param data Cut range relative to the array emitted by `historyCut$`
   */
  cutByRange(data: CutRangeArg) {
    const [from, to] = normalizeCutRange(data);
    this.historyCut$.pipe(first()).subscribe((historyCut) => this.cut(historyCut.slice(from, to + 1)));
  }

  undoAll() {
    const events = this.getOwnerDrawEvents(this.history);
    this.cut(events);
  }

  redraw(animate = true) {
    const events = [getClearEvent(), ...this.history];
    this.broadcast$$.next(drawEventsBroadcastMapper(events, animate));
  }

  setCutRange(data: CutRangeArg) {
    const cutRange = normalizeCutRange(data);
    if (cutRange[0] !== this.cutRange[0] || cutRange[1] !== this.cutRange[1]) {
      this.cutRange = cutRange;
      this.cutRange$$.next(cutRange);
    }
    return cutRange;
  }
}
