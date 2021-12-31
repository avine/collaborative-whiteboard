import { BehaviorSubject, combineLatest, Subject } from 'rxjs';
import { first, map } from 'rxjs/operators';

import { Injectable } from '@angular/core';

import { DEFAULT_DRAW_MODE, DEFAULT_OWNER, getDefaultFillBackground } from './cw.config';
import {
  CutRange,
  CutRangeArg,
  DrawEvent,
  DrawEventsBroadcast,
  DrawFillRect,
  DrawMode,
  DrawTransport,
  FillBackground,
  Owner,
} from './cw.types';
import { getClearEvent, getFillRectEvent, mapToDrawEventsBroadcast, normalizeCutRange } from './utils/common';

@Injectable()
export class CwService {
  private owner$$ = new BehaviorSubject<Owner>(DEFAULT_OWNER);

  private drawMode$$ = new BehaviorSubject<DrawMode>(DEFAULT_DRAW_MODE);

  private fillBackground$$ = new BehaviorSubject<FillBackground>(getDefaultFillBackground());

  private historyMap = new Map<string, DrawEvent>();

  private historyRedo: DrawEvent[][] = [];

  private history$$ = new BehaviorSubject<DrawEvent[]>([]);

  private cutRange$$ = new BehaviorSubject<CutRange>([0, 0]);

  /**
   * Dispatch draw events from the server to the client
   */
  private broadcast$$ = new Subject<DrawEventsBroadcast>();

  /**
   * Dispatch draw events from the client to the server
   */
  private emit$$ = new Subject<DrawTransport>();

  owner$ = this.owner$$.asObservable();

  drawMode$ = this.drawMode$$.asObservable();

  fillBackground$ = this.fillBackground$$.asObservable();

  history$ = this.history$$.asObservable();

  historyCut$ = this.history$$.pipe(map((history) => this.getOwnerDrawEvents(history)));

  historyCutLength$ = this.historyCut$.pipe(map((historyCut) => historyCut.length));

  cutRange$ = this.cutRange$$.asObservable();

  broadcastHistoryCut$ = combineLatest([this.historyCut$, this.cutRange$$]).pipe(
    map(([historyCut, [from, to]]) => {
      const slice = [getClearEvent(this.owner), ...historyCut.slice(from, to + 1)];
      return mapToDrawEventsBroadcast(slice);
    })
  );

  broadcast$ = this.broadcast$$.asObservable();

  emit$ = this.emit$$.asObservable();

  set owner(owner: Owner) {
    this.owner$$.next(owner);
  }
  get owner() {
    return this.owner$$.value;
  }

  set drawMode(drawMode: DrawMode) {
    this.drawMode$$.next(drawMode);
  }
  get drawMode(): DrawMode {
    return this.drawMode$$.value;
  }

  switchDrawMode() {
    const modes: DrawMode[] = ['brush', 'line', 'rectangle', 'ellipse'];
    this.drawMode = modes[(modes.indexOf(this.drawMode$$.value) + 1) % modes.length];
  }

  private pushHistory(event: DrawEvent) {
    this.historyMap.set(event.id, event);
  }

  private pullHistory(event: DrawEvent): boolean {
    return this.historyMap.delete(event.id);
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

  private replaceHistory(event: DrawEvent, index = 0): boolean {
    const historyMapEntries = Array.from(this.historyMap.entries());
    if (index >= historyMapEntries.length - 1) {
      return false;
    }
    historyMapEntries[index] = [event.id, event];
    this.historyMap = new Map(historyMapEntries);
    return true;
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
      while (redos.length || this.historyRedo.length) {
        if (!redos.length) {
          redos = this.historyRedo.shift() || []; // redos = this.popHistoryRedo(); // FIXME...
        }
        while (redos.length) {
          const redo = redos.shift();
          if (redo?.id === event.id) {
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

  get history(): DrawEvent[] {
    return Array.from(this.historyMap.values());
  }

  private emitHistory() {
    this.history$$.next(this.history);
    this.checkCutRange();
  }

  private checkCutRange() {
    const [from, to] = this.cutRange$$.value;
    if (to >= this.history.length) {
      const lastIndex = this.history.length - 1;
      this.setCutRange([Math.min(from, lastIndex), lastIndex]);
    }
  }

  private getOwnerDrawEvents(events: DrawEvent[]) {
    return events.filter((event) => event.owner === this.owner$$.value);
  }

  private getOwnerLastHash(): string | void {
    const historyMapEntries = Array.from(this.historyMap.entries());
    for (let i = historyMapEntries.length - 1; i >= 0; i--) {
      const [hash, event] = historyMapEntries[i];
      if (event.owner === this.owner$$.value) {
        return hash;
      }
    }
  }

  private broadcastAdd(events: DrawEvent[]) {
    events.forEach((event) => this.pushHistory(event));
    const ownerEvents = this.getOwnerDrawEvents(events);
    if (ownerEvents.length) {
      this.dropHistoryRedoAgainst(ownerEvents);
    }
    this.broadcast$$.next(mapToDrawEventsBroadcast(events, true));
    this.emitHistory();
  }

  private broadcastRemove(events: DrawEvent[]) {
    const removed = events.filter((event) => this.pullHistory(event));
    if (removed.length) {
      const ownerEvents = this.getOwnerDrawEvents(removed);
      if (ownerEvents.length) {
        this.pushHistoryRedo(ownerEvents);
      }
      this.broadcast$$.next(
        mapToDrawEventsBroadcast([getClearEvent(this.owner), ...this.backgroundEvent, ...this.history])
      );
      this.emitHistory();
    }
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
    this.pushHistory(event);
    this.dropHistoryRedoAgainst([event]);
    this.emit$$.next({ action: 'add', events: [event] });
    this.emitHistory();
  }

  undo() {
    const event = this.popHistory();
    if (event) {
      this.pushHistoryRedo([event]);
      this.broadcast$$.next(
        mapToDrawEventsBroadcast([getClearEvent(this.owner), ...this.backgroundEvent, ...this.history])
      );
      this.emit$$.next({ action: 'remove', events: [event] });
      this.emitHistory();
    }
  }

  redo() {
    const events = this.popHistoryRedo();
    if (events) {
      events.forEach((event) => this.pushHistory(event));
      this.broadcast$$.next(mapToDrawEventsBroadcast(events, true));
      this.emit$$.next({ action: 'add', events });
      this.emitHistory();
    }
  }

  cut(events: DrawEvent[]) {
    const removed = events.filter((event) => this.pullHistory(event));
    if (removed.length) {
      this.pushHistoryRedo(removed);
      this.broadcast$$.next(
        mapToDrawEventsBroadcast([getClearEvent(this.owner), ...this.backgroundEvent, ...this.history])
      );
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
    const events = [getClearEvent(this.owner), ...this.backgroundEvent, ...this.history];
    this.broadcast$$.next(mapToDrawEventsBroadcast(events, animate));
  }

  setCutRange(data: CutRangeArg) {
    const cutRange = normalizeCutRange(data);
    if (cutRange[0] !== this.cutRange$$.value[0] || cutRange[1] !== this.cutRange$$.value[1]) {
      this.cutRange$$.next(cutRange);
    }
    return cutRange;
  }

  setFillBackground(fillBackground: FillBackground) {
    this.fillBackground$$.next(fillBackground);
    this.redraw(false);
  }

  private get backgroundEvent(): DrawFillRect[] {
    const events: DrawFillRect[] = [];
    const { transparent, color, opacity } = this.fillBackground$$.value;
    if (!transparent) {
      events.push(getFillRectEvent('255, 255, 255', 1, this.owner));
    }
    if (color) {
      events.push(getFillRectEvent(color, opacity, this.owner));
    }
    return events;
  }
}
