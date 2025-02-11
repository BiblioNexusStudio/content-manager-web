import { log } from '$lib/logger';
import type { AudioContentItem, Content, ResourceContent } from '$lib/types/resources';
import { asyncMap, filterBoolean } from '$lib/utils/array';
import { getContext, setContext } from 'svelte';
import { unzip } from 'unzipit';

export type AudioTracklist = AudioTrack[];

export type AudioTrack = {
    url: string;
    currentTime: number;
};

export type AudioType = 'mp3' | 'webm';

export class AudioPlaylist {
    element: HTMLAudioElement | undefined = $state();
    paused: boolean = $state(true);
    playbackRate: number = $state(1);
    currentAudioType: AudioType = $state('webm');
    currentTrackIndex: number = $state(0);
    currentTrackTimeElapsed: number = $state(0);
    tracks: AudioTracklist | [] = $state([]);

    nextTrack() {
        if (this.hasNextTrack()) {
            this.currentTrack()!.currentTime = this.currentTrackTimeElapsed;
            this.currentTrackIndex += 1;
            this.currentTrackTimeElapsed = this.currentTrack()!.currentTime;
        }
    }

    prevTrack() {
        if (this.hasPrevTrack()) {
            this.currentTrack()!.currentTime = this.currentTrackTimeElapsed;
            this.currentTrackIndex -= 1;
            this.currentTrackTimeElapsed = this.currentTrack()!.currentTime;
        }
    }

    currentTrack(): AudioTrack | null {
        return this.tracks[this.currentTrackIndex] || null;
    }

    currentTrackSrc(): string {
        return this.currentTrack()?.url || '';
    }

    isEmpty(): boolean {
        return this.tracks.length === 0;
    }

    hasNextTrack(): boolean {
        return this.tracks.length > this.currentTrackIndex;
    }

    hasPrevTrack(): boolean {
        return this.tracks.length > 1 && this.currentTrackIndex > 0;
    }

    setPlaybackRate(rate: number) {
        this.playbackRate = rate;
        if (this.element) this.element.playbackRate = rate;
    }
}

const key = Symbol('audioPlayer');

export function createAudioPlaylistContext(): AudioPlaylist {
    setContext(key, new AudioPlaylist());
    return getAudioPlaylistContext();
}

export function setAudioPlaylistContext(playlist: AudioPlaylist) {
    setContext(key, playlist);
}

export function getAudioPlaylistContext<AudioPlaylist>() {
    return getContext(key) as AudioPlaylist;
}

export async function fetchFiaAudioFromZip(
    audioResourceContent: ResourceContent[],
    audioType: AudioType = 'webm'
): Promise<AudioTracklist | []> {
    return filterBoolean(
        await asyncMap(audioResourceContent, async (resourceContent): Promise<AudioTracklist | []> => {
            try {
                const audioItem = resourceContent.content as AudioContentItem;
                const audioTypeSteps = audioItem[audioType].steps;
                if (!audioTypeSteps) return [];
                return await readFilesIntoObjectUrlsMapping(audioItem[audioType].url, audioTypeSteps);
            } catch (error) {
                log.exception(error as Error);
                return [];
            }
        })
    ).flat();
}

interface ObjectUrlMapping {
    url?: string | null;
    file: string;
    stepNumber: number;
}

export async function readFilesIntoObjectUrlsMapping<T extends ObjectUrlMapping>(zipUrl: string, mapping: T[]) {
    const { entries } = await unzip(zipUrl);
    const fileAndBlob = await asyncMap(Object.entries(entries), async ([key, value]) => [key, await value.blob()]);
    const blobsByFile = Object.fromEntries(fileAndBlob);

    const maxStep = Math.max(...mapping.map((m) => m.stepNumber));
    const result = new Array(maxStep);

    for (let i = 0; i < maxStep; i++) {
        result[i] = {
            currentTime: 0,
            url: '',
        };
    }

    mapping.forEach((map) => {
        const fileSplit = map.file.split('.');
        const extension = fileSplit[fileSplit.length - 1];

        result[map.stepNumber - 1] = {
            currentTime: 0,
            url: blobsByFile[map.file]
                ? URL.createObjectURL(new Blob([blobsByFile[map.file]], { type: 'audio/' + extension }))
                : null,
        };
    });

    return result;
}

export function isAudioContentItem(item: Content): item is AudioContentItem {
    return item && typeof item === 'object' && 'mp3' in item && 'webm' in item;
}
