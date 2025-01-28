<script lang="ts">
    import InfoIcon from '$lib/icons/InfoIcon.svelte';
    import Select from '$lib/components/Select.svelte';
    import { UserRole, type Company } from '$lib/types/base';
    import { postToApi } from '$lib/utils/http-service';
    import { isApiErrorWithMessage, isAuthorizationError } from '$lib/utils/http-errors';
    import { invalidateAll } from '$app/navigation';
    import { Permission, currentUser, userCan } from '$lib/stores/auth';
    import { log } from '$lib/logger';

    interface Props {
        open: boolean;
        header: string;
        companies: Company[] | undefined;
        roles: UserRole[];
    }
    let { open = $bindable(), header, companies, roles }: Props = $props();
    let dialog: HTMLDialogElement;
    let firstName: string | null = $state(null);
    let firstNameErr: string | null = $state(null);
    let lastName: string | null = $state(null);
    let lastNameErr: string | null = $state(null);
    let email: string | null = $state(null);
    let emailErr: string | null = $state(null);
    let role: UserRole | null = $state(null);
    let isSaving = $state(false);
    let errorMessage: string | null = $state(null);
    let isValidInput = $state(true);
    const inputMinCharErrMessage = 'Please enter at least 3 characters';
    const onlyCreateUserInCompany = $userCan(Permission.CreateUserInCompany);

    $effect(() => {
        if (dialog) open ? dialog.showModal() : dialog.close();
    });

    let companyId = $state(onlyCreateUserInCompany ? $currentUser!.company.id : null);
    let canSave = $derived(!!firstName && !!lastName && !!email && !!companyId && !!role && isValidInput);

    $effect(() => {
        if (!firstNameErr && !lastNameErr && !emailErr && !errorMessage) {
            isValidInput = true;
        }
    });

    function buildOptions(companies: Company[]) {
        let companyOptions = [
            ...companies.filter((c) => c.name !== 'N/A').map((c) => ({ value: c.id, label: c.name })),
        ];
        if (onlyCreateUserInCompany) {
            // Users page is checked for permissions to even get here, and people should always
            // be connected to a company
            return [companyOptions.find((c) => c.value === $currentUser!.company.id)!];
        } else {
            return [{ value: null, label: 'Select Company' }, ...companyOptions];
        }
    }

    function getRoles() {
        if (onlyCreateUserInCompany) {
            roles = [UserRole.Editor, UserRole.Reviewer];
        }
        const roleOptions = [...(roles || []).map((r) => ({ value: r, label: r }))];
        return [...[{ value: null, label: 'Select Role' }, ...roleOptions]];
    }

    function validateLength(input: string | null) {
        if (input && !(input.length >= 3)) {
            errorMessage = 'Input validation failed';
            isValidInput = false;
            return false;
        }
        return true;
    }

    function validateEmail() {
        if (!email?.includes('@')) {
            isValidInput = false;
            errorMessage = 'Input validation failed';
            return false;
        }
        return true;
    }

    function close() {
        open = false;
    }

    async function handlePrimaryClick() {
        isSaving = true;
        !validateLength(firstName) ? (firstNameErr = inputMinCharErrMessage) : (firstNameErr = null);
        !validateLength(lastName) ? (lastNameErr = inputMinCharErrMessage) : (lastNameErr = null);
        !validateEmail() ? (emailErr = 'Must be a valid email') : (emailErr = null);

        try {
            if (canSave) {
                await postToApi('/users/create', {
                    email,
                    firstName,
                    lastName,
                    role: (role as string).replaceAll(' ', ''),
                    companyId,
                });
                errorMessage = null;
                await invalidateAll();
            }
        } catch (error) {
            if (isAuthorizationError(error)) {
                errorMessage = 'You are not authorized';
            } else if (isApiErrorWithMessage(error, 'The user already exists.')) {
                errorMessage = 'User with that email already exists';
            } else {
                log.exception(error);
                errorMessage = 'User creation failed';
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
            <button class="text-gray-60 btn btn-circle btn-ghost btn-sm absolute right-2 top-4" onclick={close}
                >✕</button
            >
        </form>
        <div class="mt-0 flex items-center rounded-t border-b border-primary bg-primary bg-opacity-10 p-4 text-primary">
            <InfoIcon />
            <h3 class="ml-4 text-xl font-semibold text-primary">
                {header}
            </h3>
        </div>

        <div class="flex flex-col p-10">
            <div class="flex flex-col p-2">
                <div class="text-md flex flex-row justify-between">
                    <div>First Name <span class="text-error">*</span></div>
                    {#if firstNameErr}
                        <div class="text-error">{firstNameErr}</div>
                    {/if}
                </div>
                <div class="flex-grow"></div>
                <input
                    class="input input-bordered max-h-[50%] w-full"
                    bind:value={firstName}
                    oninput={() => {
                        firstNameErr = null;
                        errorMessage = null;
                    }}
                />
            </div>
            <div class="flex flex-col p-2">
                <div class="text-md flex flex-row justify-between">
                    <div>Last Name <span class="text-error">*</span></div>
                    {#if lastNameErr}
                        <div class="text-error">{lastNameErr}</div>
                    {/if}
                </div>
                <div class="flex-grow"></div>
                <input
                    class="input input-bordered max-h-[50%] w-full"
                    bind:value={lastName}
                    oninput={() => {
                        lastNameErr = null;
                        errorMessage = null;
                    }}
                />
            </div>
            <div class="flex flex-col p-2">
                <div class="text-md flex flex-row justify-between">
                    <div>Email <span class="text-error">*</span></div>
                    {#if emailErr}
                        <div class="text-error">{emailErr}</div>
                    {/if}
                </div>
                <div class="flex-grow"></div>
                <input
                    type="email"
                    class="input input-bordered max-h-[50%] w-full"
                    bind:value={email}
                    oninput={() => {
                        emailErr = null;
                        errorMessage = null;
                    }}
                />
            </div>
            <div class="flex flex-col p-2">
                <div class="text-md">Company <span class="text-error">*</span></div>
                {#if companies}
                    <Select
                        class="select select-bordered w-full"
                        options={buildOptions(companies)}
                        isNumber={true}
                        bind:value={companyId}
                        disabled={onlyCreateUserInCompany}
                    />
                {/if}
            </div>
            <div class="flex flex-col border-b p-2 pb-4">
                <div class="text-md">
                    Role <span class="text-error">*</span>
                </div>
                <Select class="select select-bordered w-full" options={getRoles()} isNumber={false} bind:value={role} />
            </div>
        </div>
        <div class="flex w-full flex-row justify-end pr-4">
            {#if errorMessage}
                <div class="pr-2 pt-2 text-error">{errorMessage}</div>
            {/if}
            <button class="btn btn-primary" onclick={handlePrimaryClick} disabled={!canSave}
                >{#if isSaving}
                    <span class="loading loading-spinner"></span>
                {:else}
                    Add User
                {/if}</button
            >
        </div>
    </div>
</dialog>
