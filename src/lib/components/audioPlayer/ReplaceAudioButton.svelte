<script lang="ts">
    import Modal from '$lib/components/Modal.svelte';
    import { postFormDataToApi, getFromApi } from '$lib/utils/http-service';
    import { type UploadAudioFileResponse, type AudioUploadStatus, PollingStatus } from '$lib/types/resources';
    interface Props {
        hasSteps: boolean;
        selectedStepNumber: number;
        resourceContentId: number;
        stepHasAudio: boolean;
    }

    let { hasSteps, selectedStepNumber, resourceContentId, stepHasAudio }: Props = $props();

    const acceptedAudioTypes = [
        'audio/aac',
        'audio/flac',
        'audio/mp3',
        'audio/mpeg',
        'audio/ogg',
        'audio/opus',
        'audio/speex',
        'audio/vorbis',
        'audio/wav',
        'audio/webm',
        'audio/x-aac',
        'audio/x-flac',
        'audio/x-mp3',
        'audio/x-mpeg',
        'audio/x-ms-wma',
        'audio/x-ogg',
        'audio/x-ogg-flac',
        'audio/x-ogg-pcm',
        'audio/x-oggflac',
        'audio/x-oggpcm',
        'audio/x-speex',
        'audio/x-wav',
    ];

    let confirmUploadModalOpen = $state(false);
    let audioFileName = $state('[file name]');
    let audioFileUploadingModalOpen = $state(false);
    let isTransacting = $state(false);
    let file: File | null = $state(null);

    let startPolling = $state(false);
    let pollId = $state<number | null>(null);
    let pollStatus = $state<AudioUploadStatus | null>(null);
    let errorMessageModalOpen = $state(false);

    async function uploadAudioFile(): Promise<void> {
        try {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = acceptedAudioTypes.join(',');
            input.style.display = 'none';
            document.body.appendChild(input);

            file = await new Promise<File | null>((resolve) => {
                input.onchange = () => {
                    resolve(input.files?.[0] ?? null);
                    document.body.removeChild(input);
                };
                input.click();
            });

            if (!file) {
                return;
            }

            audioFileName = file.name;
            confirmUploadModalOpen = true;
        } catch {
            isTransacting = false;
            confirmUploadModalOpen = false;

            errorMessageModalOpen = true;
        }
    }

    async function uploadFileAfterConfirm() {
        if (!file) {
            return;
        }

        isTransacting = true;
        confirmUploadModalOpen = false;
        audioFileUploadingModalOpen = true;

        try {
            const formData = new FormData();
            formData.append('file', file);

            let url = `/resources/content/${resourceContentId}/uploads`;

            if (hasSteps) {
                url = `${url}?stepNumber=${selectedStepNumber}`;
            }

            const response = await postFormDataToApi<UploadAudioFileResponse>(url, formData);

            pollId = response?.uploadId ?? null;
            startPolling = true;
        } catch {
            isTransacting = false;
            audioFileUploadingModalOpen = false;

            errorMessageModalOpen = true;
        }
    }

    function pollForStatus(startPolling: boolean, pollId: number | null) {
        if (!startPolling || !pollId) return;
        const interval = setInterval(async () => {
            if (startPolling && pollId) {
                pollStatus = await getFromApi<AudioUploadStatus>(`/uploads/${pollId}`);
                if (pollStatus.status === PollingStatus.completed) {
                    startPolling = false;
                    pollId = null;
                    pollStatus = null;
                    isTransacting = false;
                    clearInterval(interval);
                    window.location.reload();
                } else if (pollStatus.status === PollingStatus.failed) {
                    startPolling = false;
                    pollId = null;
                    pollStatus = null;
                    isTransacting = false;
                    clearInterval(interval);
                    errorMessageModalOpen = true;
                }
            } else {
                clearInterval(interval);
            }
        }, 5000);
    }

    $effect(() => {
        pollForStatus(startPolling, pollId);
    });
</script>

<div class="mb-4">
    <button
        class="btn btn-primary"
        onclick={uploadAudioFile}
        disabled={hasSteps && !stepHasAudio}
        data-app-insights-event-name="replace-audio-button-click"
    >
        Replace Audio
    </button>
</div>

<Modal
    bind:open={confirmUploadModalOpen}
    header="Confirm Audio File Upload"
    description={`Are you sure you want to upload ${audioFileName}?`}
    primaryButtonText="Upload"
    primaryButtonOnClick={uploadFileAfterConfirm}
/>

<Modal bind:open={audioFileUploadingModalOpen} header="Audio File Upload in Progress" {isTransacting}>
    <div class="flex flex-col">
        <div class="mb-4">Please do not close this tab or window.</div>
        <div class="mb-4">This page will refresh when the upload is complete.</div>
        {#if startPolling}
            <div class="mb-4 flex text-lg font-bold">
                <span>Uploading Status: {pollStatus?.status ?? PollingStatus.pending}</span>
                <div class="flex items-end">
                    <div class="loading loading-dots loading-xs"></div>
                </div>
            </div>
        {/if}
    </div>
</Modal>

<Modal
    bind:open={errorMessageModalOpen}
    header="Audio File Upload Error"
    isError={true}
    description="An error occurred while uploading the audio file. Please try again."
/>
