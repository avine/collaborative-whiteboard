import { BehaviorSubject, Subject } from 'rxjs';
import { map } from 'rxjs/operators';

import { Injectable } from '@angular/core';

import { DEFAULT_DRAW_MODE, DEFAULT_OWNER, getDefaultBackground } from './cw.config';
import { Background, DrawBackground, DrawEvent, DrawEventsBroadcast, DrawMode, DrawTransport, Owner } from './cw.types';
import {
  defineEventDataSnapshot,
  deleteEventDataSnapshot,
  getBackgroundEvent,
  getClearEvent,
  getSelectionEvents,
  resizeEvent,
  translateEvent,
} from './utils';

@Injectable()
export class CwService {
  // !FIXME: should we use the owner ?
  private owner$$ = new BehaviorSubject<Owner>(DEFAULT_OWNER);

  private drawMode$$ = new BehaviorSubject<DrawMode>(DEFAULT_DRAW_MODE);

  private background$$ = new BehaviorSubject<Background>(getDefaultBackground());

  private historyMap = new Map<string, DrawEvent>();

  private historyRedo: DrawEvent[][] = [];

  private history$$ = new BehaviorSubject<DrawEvent[]>([]);

  private selectionSet = new Set<string>();

  private selection$$ = new BehaviorSubject<DrawEvent[]>([]);

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

  background$ = this.background$$.asObservable();

  history$ = this.history$$.asObservable();

  // !FIXME: does the selection should be based on ownerHistory ?
  ownerHistory$ = this.history$$.pipe(map((history) => this.getOwnerDrawEvents(history)));

  selection$ = this.selection$$.asObservable();

  broadcast$ = this.broadcast$$.asObservable();

  emit$ = this.emit$$.asObservable();

  set owner(owner: Owner) {
    this.owner$$.next(owner);
  }
  get owner() {
    return this.owner$$.value;
  }

  set drawMode(drawMode: DrawMode) {
    // Clear selection when leaving 'selection' mode
    if (this.drawMode$$.value === 'selection' && drawMode !== 'selection') {
      this.clearSelection();
    }
    this.drawMode$$.next(drawMode);
  }
  get drawMode(): DrawMode {
    return this.drawMode$$.value;
  }

  private pushHistory(event: DrawEvent) {
    this.historyMap.set(event.id, event);
  }

  private pullHistory(event: DrawEvent): boolean {
    return this.historyMap.delete(event.id);
  }

  private popHistory(eventId = this.getOwnerLastEventId()): DrawEvent | void {
    if (!eventId) {
      return;
    }
    const removed = this.historyMap.get(eventId);
    if (!removed) {
      return;
    }
    this.historyMap.delete(eventId);
    return removed;
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
            // FIXME: Is this a bug ?
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
  }

  private updateSelection(action: 'add' | 'delete', eventsId: string[]): boolean {
    const previousSize = this.selectionSet.size;
    eventsId.forEach((eventId) => this.selectionSet[action](eventId));
    return this.selectionSet.size !== previousSize;
  }

  addSelection(eventsId: string[]): boolean {
    if (!this.updateSelection('add', eventsId)) {
      return false;
    }
    this.emitSelection();
    this.redraw();
    return true;
  }

  private _selectOne(eventsId: string[]): boolean {
    if (eventsId.length === 0 || (eventsId.length === 1 && this.selectionSet.has(eventsId[0]))) {
      return false;
    }
    let lastIndex = -1;
    eventsId.forEach((eventId, index) => {
      if (this.selectionSet.has(eventId)) {
        lastIndex = index;
      }
    });
    this.selectionSet.clear();
    const index = lastIndex === -1 ? 0 : (lastIndex + 1) % eventsId.length;
    this.selectionSet.add(eventsId[index]);
    return true;
  }

  selectOne(eventsId: string[]): boolean {
    if (!this._selectOne(eventsId)) {
      return false;
    }
    this.emitSelection();
    this.redraw();
    return true;
  }

  removeSelection(eventsId: string[]): boolean {
    if (!this.updateSelection('delete', eventsId)) {
      return false;
    }
    this.emitSelection();
    this.redraw();
    return true;
  }

  clearSelection(): boolean {
    if (!this.selectionSet.size) {
      return false;
    }
    this.selectionSet.clear();
    this.emitSelection();
    this.redraw();
    return true;
  }

  private emitSelection() {
    this.selection$$.next(Array.from(this.selectionSet).map((eventId) => this.historyMap.get(eventId) as DrawEvent));
  }

  private checkSelection() {
    const eventsId = Array.from(this.selectionSet);
    const events = this.mapEventsIdToDrawEvents(eventsId);
    if (events.length === eventsId.length) {
      return;
    }
    this.selectionSet = new Set(events.map(({ id }) => id));
    this.selection$$.next(events);
  }

  private mapEventsIdToDrawEvents(eventsId: string[]): DrawEvent[] {
    return eventsId
      .map((eventId) => this.historyMap.get(eventId))
      .filter((event: DrawEvent | undefined): event is DrawEvent => !!event);
  }

  private getOwnerDrawEvents(events: DrawEvent[]) {
    return events.filter((event) => event.owner === this.owner$$.value);
  }

  private getOwnerLastEventId(): string | void {
    const historyMapEntries = Array.from(this.historyMap.entries());
    for (let i = historyMapEntries.length - 1; i >= 0; i--) {
      const [eventId, event] = historyMapEntries[i];
      if (event.owner === this.owner$$.value) {
        return eventId;
      }
    }
  }

  private broadcastBackground(background: Background) {
    this.background$$.next(background);
    this.redraw();
  }

  private broadcastAdd(events: DrawEvent[]) {
    events.forEach((event) => this.pushHistory(event));
    const ownerDrawEvents = this.getOwnerDrawEvents(events);
    if (ownerDrawEvents.length) {
      this.dropHistoryRedoAgainst(ownerDrawEvents);
    }
    this.emitHistory();
    this.broadcast$$.next({ events, animate: true });
  }

  private broadcastRemove(events: DrawEvent[]) {
    const removed = events.filter((event) => this.pullHistory(event));
    if (removed.length) {
      const ownerDrawEvents = this.getOwnerDrawEvents(removed);
      if (ownerDrawEvents.length) {
        this.pushHistoryRedo(ownerDrawEvents);
      }
      this.checkSelection();
      this.emitHistory();
      this.redraw();
    }
  }

  private broadcastTranslate(eventsId: string[], x: number, y: number) {
    this.translateDrawEvents(this.mapEventsIdToDrawEvents(eventsId), x, y);
    this.emitHistory();
    this.emitSelection();
    this.redraw();
  }

  private broadcastResize(eventsId: string[], origin: [number, number], scale: [number, number]) {
    this.resizeDrawEvents(this.mapEventsIdToDrawEvents(eventsId), origin, scale);
    this.emitHistory();
    this.emitSelection();
    this.redraw();
  }

  /**
   * Dispatch draw events from the server to the client
   */
  broadcast(transport: DrawTransport) {
    switch (transport.action) {
      case 'background': {
        this.broadcastBackground(transport.background);
        break;
      }
      case 'add': {
        this.broadcastAdd(transport.events);
        break;
      }
      case 'remove': {
        this.broadcastRemove(this.mapEventsIdToDrawEvents(transport.eventsId));
        break;
      }
      case 'translate': {
        this.broadcastTranslate(transport.eventsId, ...transport.translate);
        break;
      }
      case 'resize': {
        this.broadcastResize(transport.eventsId, transport.origin, transport.scale);
        break;
      }
      default: {
        console.error('Unhandled "DrawTransport" event', transport);
        break;
      }
    }
  }

  /**
   * Dispatch draw events from the client to the server
   */
  emit(event: DrawEvent) {
    this.pushHistory(event);
    this.dropHistoryRedoAgainst([event]);
    this.emitHistory();
    this.emit$$.next({ action: 'add', events: [event] });
  }

  undo() {
    const event = this.popHistory();
    if (event) {
      this.pushHistoryRedo([event]);
      this.checkSelection();
      this.emitHistory();
      this.redraw();
      this.emit$$.next({ action: 'remove', eventsId: [event.id] });
    }
  }

  redo() {
    const events = this.popHistoryRedo();
    if (events) {
      events.forEach((event) => this.pushHistory(event));
      this.emitHistory();
      this.broadcast$$.next({ events, animate: true });
      this.emit$$.next({ action: 'add', events });
    }
  }

  private cut(events: DrawEvent[]) {
    const removed = events.filter((event) => this.pullHistory(event));
    if (removed.length) {
      this.pushHistoryRedo(removed);
      this.checkSelection();
      this.emitHistory();
      this.redraw();
      this.emit$$.next({ action: 'remove', eventsId: removed.map(({ id }) => id) });
    }
  }

  undoAll() {
    this.cut(this.getOwnerDrawEvents(this.history));
  }

  cutSelection() {
    this.cut(this.selection$$.value);
  }

  // !FIXME: for now, the event.id remains the same. Is this a problem ?
  private translateDrawEvents(events: DrawEvent[], x: number, y: number) {
    events.forEach((event) => this.pushHistory(translateEvent(event, x, y)));
  }

  translateSelection(x: number, y: number) {
    this.translateDrawEvents(this.selection$$.value, x, y);
    this.emitHistory();
    this.emitSelection();
    this.redraw();
  }

  emitTranslatedSelection(x: number, y: number) {
    this.emit$$.next({ action: 'translate', eventsId: Array.from(this.selectionSet.values()), translate: [x, y] });
  }

  private resizeDrawEvents(events: DrawEvent[], origin: [number, number], scale: [number, number]) {
    events.forEach((event) => this.pushHistory(resizeEvent(event, origin, scale)));
  }

  resizeSelection(origin: [number, number], scale: [number, number]) {
    this.selection$$.value.forEach((event) => defineEventDataSnapshot(event));
    this.resizeDrawEvents(this.selection$$.value, origin, scale);
    this.emitHistory();
    this.emitSelection();
    this.redraw();
  }

  emitResizedSelection(origin: [number, number], scale: [number, number]) {
    this.selection$$.value.forEach((event) => deleteEventDataSnapshot(event));
    this.emit$$.next({ action: 'resize', eventsId: Array.from(this.selectionSet.values()), origin, scale });
  }

  redraw(animate = false) {
    const events: DrawEvent[] = [
      getClearEvent(this.owner),
      ...this.backgroundEvents,
      ...this.history,
      ...this.selectionEvents,
    ];
    this.broadcast$$.next({ events, animate });
  }

  setBackground(background: Background) {
    this.background$$.next(background);
    this.emit$$.next({ action: 'background', background });
    this.redraw();
  }

  private get backgroundEvents(): DrawBackground[] {
    const events: DrawBackground[] = [];
    const { transparent, color, opacity } = this.background$$.value;
    if (!transparent) {
      events.push(getBackgroundEvent('255, 255, 255', 1, this.owner));
    }
    if (color) {
      events.push(getBackgroundEvent(color, opacity, this.owner));
    }
    return events;
  }

  private get selectionEvents() {
    return getSelectionEvents(this.selection$$.value, this.owner);
  }
}
