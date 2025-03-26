<script lang="ts">
    import Modal from '$lib/components/Modal.svelte';
    import { postFormDataToApi } from '$lib/utils/http-service';

    interface Props {
        hasSteps: boolean;
        selectedStepNumber: number;
        resourceContentId: number;
    }

    let { hasSteps, selectedStepNumber, resourceContentId }: Props = $props();

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
    let errorMessageModalOpen = $state(false);
    let audioFileName = $state('[file name]');
    let audioFileUploadingModalOpen = $state(false);
    let isTransacting = $state(false);
    let file: File | null = $state(null);

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

            await postFormDataToApi(url, formData);

            audioFileUploadingModalOpen = false;

            location.reload();
        } catch {
            isTransacting = false;
            audioFileUploadingModalOpen = false;

            errorMessageModalOpen = true;
        }
    }
</script>

<div class="mb-4">
    <button class="btn btn-primary" onclick={uploadAudioFile} data-app-insights-event-name="replace-audio-button-click">
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

<Modal
    bind:open={audioFileUploadingModalOpen}
    header="Audio File Upload in Progress"
    {isTransacting}
    description={`Please do not close this tab or window.
        
        This page will refresh when the upload is complete.
    `}
/>

<Modal
    bind:open={errorMessageModalOpen}
    header="Audio File Upload Error"
    isError={true}
    description="An error occurred while uploading the audio file. Please try again."
/>
