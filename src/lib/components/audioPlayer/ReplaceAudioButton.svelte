<script lang="ts">
    import Modal from '$lib/components/Modal.svelte';

    let confirmUploadModalOpen = $state(false);
    let audioFileName = $state('[file name]');
    let audioFileUploadingModalOpen = $state(false);
    let isTransacting = $state(false);

    async function uploadAudioFile(): Promise<void> {
        try {
            // Check if showOpenFilePicker is available
            let file: File | null = null;
            if ('showOpenFilePicker' in window) {
                const [fileHandle] = await (window as any).showOpenFilePicker({
                    types: [
                        {
                            description: 'Audio Files',
                            accept: {
                                'audio/webm': ['.webm'],
                                'audio/mpeg': ['.mp3'],
                            },
                        },
                    ],
                    excludeAcceptAllOption: true,
                    multiple: false,
                });
                file = await fileHandle.getFile();
            } else {
                // Fallback to file input
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'audio/webm,audio/mpeg';
                input.style.display = 'none';
                document.body.appendChild(input);

                file = await new Promise<File | null>((resolve) => {
                    input.onchange = () => {
                        resolve(input.files && input.files.length > 0 ? input.files[0] : null);
                        document.body.removeChild(input);
                    };
                    input.click();
                });
            }

            if (!file) {
                console.error('No file selected');
                return;
            }

            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('https://www.thiswillbereplacedlater.com', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                console.error('Failed to upload file');
                return;
            }

            const { url } = await response.json();
            console.log('File uploaded successfully:', url);
        } catch (error) {
            console.error('Error uploading file:', error);
        }
    }

    function openModal() {
        confirmUploadModalOpen = true;
    }

    function openUploadingModal() {
        audioFileUploadingModalOpen = true;
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
    primaryButtonOnClick={() => {
        confirmUploadModalOpen = false;
    }}
/>

<Modal
    bind:open={audioFileUploadingModalOpen}
    header="Audio File Upload in Progress"
    {isTransacting}
    description={`Please do not close this tab or window.
        
        This page will refresh when the upload is complete.
    `}
/>
