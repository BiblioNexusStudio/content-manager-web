<script lang="ts">
    import InfoIcon from '$lib/icons/InfoIcon.svelte';
    import Select from '$lib/components/Select.svelte';
    import type { Company, UserRole } from '$lib/types/base';
    import type { HttpError } from '@sveltejs/kit';
    import { fetchJsonFromApiWithAuth } from '$lib/utils/http-service';

    export let open: boolean;
    export let header: string;
    export let companies: Company[] | Company | undefined;
    export let roles: UserRole[];

    let dialog: HTMLDialogElement;
    let firstName: string;
    let lastName: string;
    let email: string;
    let companyId: number | null = null;
    let role: UserRole | null = null;
    let isSaving = false;
    let errorMessage: string | null = null;

    $: dialog ? (open ? dialog.showModal() : dialog.close()) : null;

    $: companySelect = companies
        ? companies instanceof Array
            ? companies
            : [companies]
        : [{ id: -1, name: 'You are not part of a company' }];

    $: canSave =
        !!firstName &&
        !!lastName &&
        !!email &&
        email.includes('@') &&
        inputCheck([firstName, lastName]) &&
        !!companyId &&
        !!role;

    function inputCheck(input: string[]) {
        var pass = true;
        input.forEach((i) => {
            if (!(i.length > 3 && i.length <= 65)) {
                pass = false;
            }
        });
        return pass;
    }

    function close() {
        open = false;
    }

    $: isSaving;
    async function handlePrimaryClick() {
        isSaving = true;
        try {
            const user = await fetchJsonFromApiWithAuth<{ id: number }>('/users/create', {
                method: 'POST',
                body: {
                    email,
                    firstName,
                    lastName,
                    role,
                    companyId,
                },
            });
            if (!user) {
                throw new Error('No user created');
            }
            errorMessage = null;
        } catch (error) {
            // TODO: make this less hacky, need a better way to propagate errors and parse the message instead of this `includes`
            if ((error as HttpError)?.body?.message.includes('Unauthorized')) {
                errorMessage = 'You are not authorized';
            } else {
                errorMessage = 'An error occurred.';
            }
        } finally {
            isSaving = false;
            if (!errorMessage) {
                open = false;
            }
        }
    }
</script>

<dialog bind:this={dialog} class="modal">
    <div class="modal-box px-0 pt-0">
        <form method="dialog">
            <button class="text-gray-60 btn btn-circle btn-ghost btn-sm absolute right-2 top-4" on:click={close}
                >✕</button
            >
        </form>
        <div
            class="mt-0 flex items-center rounded-t border-b border-primary bg-primary bg-opacity-10 p-4 text-primary dark:border-gray-600"
        >
            <InfoIcon />
            <h3 class="ml-4 text-xl font-semibold text-primary dark:text-white">
                {header}
            </h3>
        </div>

        <div class="flex flex-col p-10">
            <div class="flex flex-col p-2">
                <div class="text-md">First Name <span class="text-error">*</span></div>
                <div class="flex-grow"></div>
                <input class="input input-bordered max-h-[50%] w-full" bind:value={firstName} />
            </div>
            <div class="flex flex-col p-2">
                <div class="text-md">Last Name <span class="text-error">*</span></div>
                <div class="flex-grow"></div>
                <input class="input input-bordered max-h-[50%] w-full" bind:value={lastName} />
            </div>
            <div class="flex flex-col p-2">
                <div class="text-md">Email <span class="text-error">*</span></div>
                <div class="flex-grow"></div>
                <input type="email" class="input input-bordered max-h-[50%] w-full" bind:value={email} />
            </div>
            <div class="flex flex-col p-2">
                <div class="text-md">Company <span class="text-error">*</span></div>
                <Select
                    class="select select-bordered w-full"
                    options={[
                        { value: null, label: 'Select Company' },
                        ...(companySelect || [])
                            .filter((c) => c.name !== 'N/A')
                            .map((c) => ({ value: c.id, label: c.name })),
                    ]}
                    isNumber={true}
                    bind:value={companyId}
                />
            </div>
            <div class="flex flex-col border-b p-2 pb-4">
                <div class="text-md">Role <span class="text-error">*</span></div>
                <Select
                    class="select select-bordered w-full"
                    options={[
                        { value: null, label: 'Select Role' },
                        ...(roles || []).map((r) => ({ value: r, label: r })),
                    ]}
                    isNumber={false}
                    bind:value={role}
                />
            </div>
        </div>
        <div class="flex w-full flex-row justify-end pr-4">
            {#if errorMessage}
                <div class="pr-2 text-error">{errorMessage}</div>
            {/if}
            <button class="btn btn-primary" on:click={handlePrimaryClick} disabled={!canSave}
                >{#if isSaving}
                    <span class="loading loading-spinner" />
                {:else}
                    Add User
                {/if}</button
            >
        </div>
    </div>
</dialog>
