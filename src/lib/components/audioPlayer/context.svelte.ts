import { getContext, setContext } from 'svelte';

// type AudioPlayer = {
//     // bindable two-way properties
//     currentTime: number;
//     paused: boolean;
//     playbackRate: number;
//     muted: boolean;
//     volume: number;

//     // bindable readonly properties
//     buffered: object[];
//     duration: number;
//     seeking: boolean;
//     ended: boolean;
//     readyState: 0 | 1 | 2 | 3 | 4;
//     seekable: object[];
//     played: object[];
// };

export type AudioPlaylist = {
    currentTrack: number;
    paused: boolean;
    tracks: AudioTrack[];
};

export type AudioTrack = AudioTrackType[];

export type AudioTrackType = {
    url: string;
    type: AudioType;
    currentTime: number;
};

export type AudioType = 'mp3' | 'webm';

// export class AudioPlayerClass implements AudioPlayer {
//     currentTime: number = $state(0);
//     paused: boolean = $state(true);
//     playbackRate: number = $state(1);
//     muted: boolean = $state(false);
//     volume: number = $state(0.5);

//     buffered: object[] = $state([]);
//     duration: number = $state(0);
//     seeking: boolean = $state(false);
//     ended: boolean = $state(false);
//     readyState: 0 | 1 | 2 | 3 | 4 = $state(0);
//     seekable: object[] = $state([]);
//     played: object[] = $state([]);
//     // nextTrack: () => void;
//     // previousTrack: () => void;
//     // play: () => void;
//     // pause: () => void;
//     // stop: () => void;
//     // seek: (seconds: number) => void;
// }

const key = Symbol('audioPlayer');

export function setAudioPlaylistContext(audioPlayList: AudioPlaylist) {
    setContext(key, audioPlayList);
}

export function getAudioPlaylistContext<AudioPlaylist>() {
    return getContext(key) as AudioPlaylist;
}
