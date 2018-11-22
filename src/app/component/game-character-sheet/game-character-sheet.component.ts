import { AfterViewInit, Component, Input, OnDestroy, OnInit } from '@angular/core';

import { Card } from '@udonarium/card';
import { EventSystem, Network } from '@udonarium/core/system/system';
import { DataElement } from '@udonarium/data-element';
import { DiceSymbol } from '@udonarium/dice-symbol';
import { GameCharacter } from '@udonarium/game-character';
import { TabletopObject } from '@udonarium/tabletop-object';
import { Terrain } from '@udonarium/terrain';

import { FileSelecterComponent } from 'component/file-selecter/file-selecter.component';
import { ModalService } from 'service/modal.service';
import { PanelService } from 'service/panel.service';
import { SaveDataService } from 'service/save-data.service';

@Component({
  selector: 'game-character-sheet',
  templateUrl: './game-character-sheet.component.html',
  styleUrls: ['./game-character-sheet.component.css']
})
export class GameCharacterSheetComponent implements OnInit, OnDestroy, AfterViewInit {

  @Input() tabletopObject: TabletopObject = null;
  private isEdit: boolean = false;

  networkService = Network;

  get isCharacter(): boolean {
    return this.tabletopObject instanceof GameCharacter;
  }

  get isCard(): boolean {
    return this.tabletopObject instanceof Card;
  }

  get isTerrain(): boolean {
    return this.tabletopObject instanceof Terrain;
  }

  get isDiceSymbol(): boolean {
    return this.tabletopObject instanceof DiceSymbol;
  }

  get isVisibleDice(): boolean {
    return this.tabletopObject instanceof DiceSymbol && this.tabletopObject.isVisible;
  }

  get diceFace(): string {
    return this.tabletopObject instanceof DiceSymbol && this.tabletopObject.face;
  }

  constructor(
    private saveDataService: SaveDataService,
    private modalService: ModalService,
    private panelService: PanelService
  ) { }

  ngOnInit() {
    this.panelService.title = 'キャラクターシート';
    if (this.tabletopObject instanceof GameCharacter && 0 < this.tabletopObject.name.length) {
      this.panelService.title += ' - ' + this.tabletopObject.name;
    }
    EventSystem.register(this)
      .on('DELETE_GAME_OBJECT', -1000, event => {
        if (this.tabletopObject && this.tabletopObject.identifier === event.data.identifier) {
          this.tabletopObject = null;
        }
      });
  }

  ngAfterViewInit() {
    console.log(this.tabletopObject);
  }

  ngOnDestroy() {
    EventSystem.unregister(this);
  }

  toggleEditMode() {
    this.isEdit = this.isEdit ? false : true;
  }

  addDataElement() {
    if (this.tabletopObject.detailDataElement) {
      let title = DataElement.create('見出し', '', {});
      let tag = DataElement.create('タグ', '', {});
      title.appendChild(tag);
      this.tabletopObject.detailDataElement.appendChild(title);
    }
  }

  saveToXML() {
    if (!this.tabletopObject) return;

    let element = this.tabletopObject.getElement('name', this.tabletopObject.commonDataElement);
    let objectName: string = element ? <string>element.value : '';

    this.saveDataService.saveGameObject(this.tabletopObject, 'xml_' + objectName);
  }

  setLocation(locationName: string) {
    this.tabletopObject.setLocation(locationName);
  }

  openModal(name: string) {
    this.modalService.open<string>(FileSelecterComponent).then(value => {
      if (!this.tabletopObject || !this.tabletopObject.imageDataElement || !value) return;
      let element = this.tabletopObject.imageDataElement.getFirstElementByName(name);
      if (!element) return;
      element.value = value;
      element.update();
    });
  }
}
