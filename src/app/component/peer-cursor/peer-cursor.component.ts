import { AfterViewInit, Component, ElementRef, Input, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';

import { EventSystem } from '@udonarium/core/system/system';
import { PeerCursor } from '@udonarium/peer-cursor';

import { PointerCoordinate, PointerDeviceService } from 'service/pointer-device.service';

@Component({
  selector: 'peer-cursor, [peer-cursor]',
  templateUrl: './peer-cursor.component.html',
  styleUrls: ['./peer-cursor.component.css']
})
export class PeerCursorComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('cursor') cursorElementRef: ElementRef;
  @ViewChild('opacity') opacityElementRef: ElementRef;
  @Input() cursor: PeerCursor = PeerCursor.myCursor;

  get iconUrl(): string { return this.cursor.image.url; }
  get name(): string { return this.cursor.name }
  get isMine(): boolean { return this.cursor.isMine; }

  private cursorElement: HTMLElement = null;
  private opacityElement: HTMLElement = null;
  private fadeOutTimer: NodeJS.Timer = null;

  private isAllowedToUpdate: boolean = true;
  private updateInterval: NodeJS.Timer = null;
  private callcack: any = (e) => this.onMouseMove(e);

  private _x: number = 0;
  private _y: number = 0;

  constructor(
    private ngZone: NgZone
  ) { }

  ngOnInit() {
    if (!this.isMine) {
      EventSystem.register(this)
        .on('CURSOR_MOVE', event => {
          if (event.sendFrom !== this.cursor.peerId) return;
          this.stopTransition();
          this.setPosition(event.data[0], event.data[1], event.data[2]);
          this.resetFadeOut();
        });
    } else {
      EventSystem.register(this)
        .on('CURSOR_MOVE', event => {
          if (event.isSendFromSelf) this.isAllowedToUpdate = true;
        });
    }
  }

  ngAfterViewInit() {
    if (this.isMine) {
      this.ngZone.runOutsideAngular(() => {
        document.body.addEventListener('mousemove', this.callcack);
        document.body.addEventListener('touchmove', this.callcack);
      });
    } else {
      this.cursorElement = this.cursorElementRef.nativeElement;
      this.opacityElement = this.opacityElementRef.nativeElement;
      this.setPosition(0, 0, 0);
      this.resetFadeOut();
    }
  }

  ngOnDestroy() {
    document.body.removeEventListener('mousemove', this.callcack);
    document.body.removeEventListener('touchmove', this.callcack);
    EventSystem.unregister(this);
  }

  private onMouseMove(e: any) {
    let x = e.touches ? e.changedTouches[0].pageX : e.pageX;
    let y = e.touches ? e.changedTouches[0].pageY : e.pageY;
    if (x === this._x && y === this._y) return;
    this._x = x;
    this._y = y;
    if (!this.updateInterval && this.isAllowedToUpdate) {
      this.isAllowedToUpdate = false;
      this.updateInterval = setTimeout(() => {
        this.updateInterval = null;
        this.calcLocalCoordinate(this._x, this._y, e.target);
      }, 100);
    }
  }

  private calcLocalCoordinate(x: number, y: number, target: HTMLElement) {
    let isTerrain = true;
    let node: HTMLElement = target;
    let dragArea = document.getElementById('app-game-table');

    while (node) {
      if (node === dragArea) break;
      node = node.parentElement;
    }
    if (node == null) isTerrain = false;

    let coordinate: PointerCoordinate = { x: x, y: y, z: 0 };
    if (!isTerrain) {
      coordinate = PointerDeviceService.convertToLocal(coordinate, dragArea);
      coordinate.z = 0;
    } else {
      coordinate = PointerDeviceService.convertLocalToLocal(coordinate, target, dragArea);
    }

    EventSystem.call('CURSOR_MOVE', [coordinate.x, coordinate.y, coordinate.z]);
  }

  private findDragAreaElement(parent: HTMLElement): HTMLElement {
    if (parent.tagName === 'DIV') {
      return parent;
    } else if (parent.tagName !== 'BODY') {
      return this.findDragAreaElement(parent.parentElement);
    }
    return null;
  }

  private resetFadeOut() {
    this.opacityElement.style.opacity = '1.0';
    clearTimeout(this.fadeOutTimer);
    this.fadeOutTimer = setTimeout(() => {
      this.opacityElement.style.opacity = '0.0';
    }, 3000);
  }

  private stopTransition() {
    this.cursorElement.style.transform = window.getComputedStyle(this.cursorElement).transform;
  }

  private setPosition(x: number, y: number, z: number) {
    this.cursorElement.style.transform = 'translateX(' + x + 'px) translateY(' + y + 'px) translateZ(' + z + 'px)';
  }
}
