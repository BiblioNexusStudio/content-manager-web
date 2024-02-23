<script lang="ts">
    import InfoIcon from '$lib/icons/InfoIcon.svelte';
    import Select from '$lib/components/Select.svelte';
    import type { Company, UserRole } from '$lib/types/base';
    import type { HttpError } from '@sveltejs/kit';

    export let open: boolean;
    export let header: string;
    export let primaryButtonOnClick:
        | ((email: string, firstName: string, lastname: string, role: UserRole, companyId: number) => void)
        | undefined = undefined;
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

    $: canSave = !!firstName && !!lastName && !!email && email.includes('@') && !!companyId && !!role;

    function close() {
        open = false;
    }

    $: isSaving;
    function handlePrimaryClick() {
        isSaving = true;
        try {
            primaryButtonOnClick?.(email, firstName, lastName, role!, companyId!);
        } catch (error) {
            if ((error as HttpError)?.body?.message) {
                errorMessage = (error as HttpError).body.message;
            }
        } finally {
            isSaving = false;
            open = false;
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
                <div class="text-error">{errorMessage}</div>
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
