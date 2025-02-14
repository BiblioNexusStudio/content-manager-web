<script>
    import TableCell from '$lib/components/TableCell.svelte';
    import RoleCell from './RoleCell.svelte';
</script>

<div class="overflow-hidden rounded-lg border-2 border-sky-300">
    <table class="table table-xs border-sky-200">
        <thead>
            <tr class="mt-4">
                <th class="pl-4">Permissions for Each User Type</th>
                <th><div class="flex justify-center">Editor</div></th>
                <th><div class="flex justify-center">Reviewer</div></th>
                <th><div class="flex justify-center">Manager</div></th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <TableCell>Edit content, leave comments, assign other users</TableCell>
                <RoleCell hasRole={true} />
                <RoleCell hasRole={true} />
                <RoleCell hasRole={true} />
            </tr>
            <tr>
                <TableCell>Send Content to Publishers</TableCell>
                <RoleCell />
                <RoleCell hasRole={true} />
                <RoleCell hasRole={true} />
            </tr>
            <tr>
                <TableCell class="max-w-[12rem]"
                    >Manage users, manage projects, manage translation pairs, assign new work</TableCell
                >
                <RoleCell />
                <RoleCell />
                <RoleCell hasRole={true} />
            </tr>
        </tbody>
    </table>
</div>
