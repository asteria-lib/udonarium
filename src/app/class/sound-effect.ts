import { AudioFile } from './core/file-storage/audio-file';
import { AudioPlayer } from './core/file-storage/audio-player';
import { AudioStorage } from './core/file-storage/audio-storage';
import { SyncObject } from './core/synchronize-object/decorator';
import { GameObject } from './core/synchronize-object/game-object';
import { EventSystem } from './core/system/system';
import { ChatMessageContext, ChatMessage } from './chat-message';
import { ObjectStore } from './core/synchronize-object/object-store';

export class PresetSound {
  static dice1: string = '';
  static dice2: string = '';
  static cardDraw: string = '';
  static cardPick: string = '';
  static cardPut: string = '';
  static cardShuffle: string = '';
  static pick: string = '';
  static put: string = '';
  static switch: string = '';
  static lock: string = '';
  static delete: string = '';
}

@SyncObject('sound-effect')
export class SoundEffect extends GameObject {

  initialize(needUpdate: boolean = true) {
    super.initialize(needUpdate);
    EventSystem.register(this)
      .on<string>('SOUND_EFFECT', event => {
        AudioPlayer.play(AudioStorage.instance.get(event.data), 0.5);
      })
      .on<ChatMessageContext>('BROADCAST_MESSAGE', -1000, event => {
        if (!event.isSendFromSelf) return;
        let chatMessage = ObjectStore.instance.get<ChatMessage>(event.data.identifier);
        if (!chatMessage || !chatMessage.isDicebot) return;
        if (Math.random() < 0.5) {
          SoundEffect.play(PresetSound.dice1);
        } else {
          SoundEffect.play(PresetSound.dice2);
        }
      });
  }

  play(identifier: string)
  play(audio: AudioFile)
  play(arg: any) {
    SoundEffect.play(arg);
  }

  static play(identifier: string)
  static play(audio: AudioFile)
  static play(arg: any) {
    let identifier = '';
    if (typeof arg === 'string') {
      identifier = arg;
    } else {
      identifier = arg.identifier;
    }
    SoundEffect._play(identifier);
  }

  private static _play(identifier: string) {
    EventSystem.call('SOUND_EFFECT', identifier);
  }
}