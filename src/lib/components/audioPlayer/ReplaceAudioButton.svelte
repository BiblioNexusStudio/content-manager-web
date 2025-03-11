<script lang="ts">
    export async function uploadAudioFile(): Promise<void> {
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
</script>

<div>
    <button class="btn btn-primary" onclick={uploadAudioFile}>Replace Audio</button>
</div>
