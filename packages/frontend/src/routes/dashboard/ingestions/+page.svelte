<script lang="ts">
	import type { PageData } from './$types';
	import * as Table from '$lib/components/ui/table';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { MoreHorizontal } from 'lucide-svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Switch } from '$lib/components/ui/switch';
	import IngestionSourceForm from '$lib/components/custom/IngestionSourceForm.svelte';
	import { api } from '$lib/api.client';
	import type { IngestionSource, CreateIngestionSourceDto } from '@open-archiver/types';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import type { BadgeVariant } from '$lib/components/ui/badge/badge.svelte';

	let { data }: { data: PageData } = $props();

	let ingestionSources = $state(data.ingestionSources);
	let isDialogOpen = $state(false);
	let selectedSource = $state<IngestionSource | null>(null);

	const openCreateDialog = () => {
		selectedSource = null;
		isDialogOpen = true;
	};

	const openEditDialog = (source: IngestionSource) => {
		selectedSource = source;
		isDialogOpen = true;
	};

	const handleDelete = async (id: string) => {
		if (!confirm('Are you sure you want to delete this ingestion source?')) {
			return;
		}
		await api(`/ingestion-sources/${id}`, { method: 'DELETE' });
		ingestionSources = ingestionSources.filter((s) => s.id !== id);
	};

	const handleSync = async (id: string) => {
		await api(`/ingestion-sources/${id}/sync`, { method: 'POST' });
		const updatedSources = ingestionSources.map((s) => {
			if (s.id === id) {
				return { ...s, status: 'importing' as const };
			}
			return s;
		});
		ingestionSources = updatedSources;
	};

	const handleToggle = async (source: IngestionSource) => {
		const isPaused = source.status === 'paused';
		const newStatus = isPaused ? 'active' : 'paused';

		if (newStatus === 'paused') {
			await api(`/ingestion-sources/${source.id}/pause`, { method: 'POST' });
		} else {
			await api(`/ingestion-sources/${source.id}`, {
				method: 'PUT',
				body: JSON.stringify({ status: 'active' })
			});
		}

		ingestionSources = ingestionSources.map((s) => {
			if (s.id === source.id) {
				return { ...s, status: newStatus };
			}
			return s;
		});
	};

	const handleFormSubmit = async (formData: CreateIngestionSourceDto) => {
		if (selectedSource) {
			// Update
			const response = await api(`/ingestion-sources/${selectedSource.id}`, {
				method: 'PUT',
				body: JSON.stringify(formData)
			});
			const updatedSource = await response.json();
			ingestionSources = ingestionSources.map((s) =>
				s.id === updatedSource.id ? updatedSource : s
			);
		} else {
			// Create
			const response = await api('/ingestion-sources', {
				method: 'POST',
				body: JSON.stringify(formData)
			});
			const newSource = await response.json();
			ingestionSources = [...ingestionSources, newSource];
		}
		isDialogOpen = false;
	};

	function getStatusClasses(status: IngestionSource['status']): string {
		switch (status) {
			case 'active':
				return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
			case 'paused':
				return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
			case 'error':
				return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
			case 'syncing':
				return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
			case 'importing':
				return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
			case 'pending_auth':
				return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
			case 'auth_success':
				return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
			default:
				return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
		}
	}
</script>

<div class="">
	<div class="mb-4 flex items-center justify-between">
		<h1 class="text-2xl font-bold">Ingestion Sources</h1>
		<Button onclick={openCreateDialog}>Create New</Button>
	</div>

	<div class="rounded-md border">
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>Name</Table.Head>
					<Table.Head>Provider</Table.Head>
					<Table.Head>Status</Table.Head>
					<Table.Head>Active</Table.Head>
					<Table.Head>Created At</Table.Head>
					<Table.Head class="text-right">Actions</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#if ingestionSources.length > 0}
					{#each ingestionSources as source (source.id)}
						<Table.Row>
							<Table.Cell>
								<a href="/dashboard/archived-emails?ingestionSourceId={source.id}">{source.name}</a>
							</Table.Cell>
							<Table.Cell class="capitalize">{source.provider.split('_').join(' ')}</Table.Cell>
							<Table.Cell class="min-w-24">
								<Badge class="{getStatusClasses(source.status)} capitalize">
									{source.status.split('_').join(' ')}
								</Badge>
							</Table.Cell>
							<Table.Cell>
								<Switch
									id={`active-switch-${source.id}`}
									class="cursor-pointer"
									checked={source.status !== 'paused'}
									onCheckedChange={() => handleToggle(source)}
									disabled={source.status !== 'active' && source.status !== 'paused'}
								/>
							</Table.Cell>
							<Table.Cell>{new Date(source.createdAt).toLocaleDateString()}</Table.Cell>
							<Table.Cell class="text-right">
								<DropdownMenu.Root>
									<DropdownMenu.Trigger>
										<Button variant="ghost" class="h-8 w-8 p-0">
											<span class="sr-only">Open menu</span>
											<MoreHorizontal class="h-4 w-4" />
										</Button>
									</DropdownMenu.Trigger>
									<DropdownMenu.Content>
										<DropdownMenu.Label>Actions</DropdownMenu.Label>
										<DropdownMenu.Item onclick={() => openEditDialog(source)}
											>Edit</DropdownMenu.Item
										>
										<DropdownMenu.Item onclick={() => handleSync(source.id)}>Sync</DropdownMenu.Item
										>
										<DropdownMenu.Separator />
										<DropdownMenu.Item class="text-red-600" onclick={() => handleDelete(source.id)}
											>Delete</DropdownMenu.Item
										>
									</DropdownMenu.Content>
								</DropdownMenu.Root>
							</Table.Cell>
						</Table.Row>
					{/each}
				{:else}
					<Table.Row>
						<Table.Cell colspan={5} class="text-center">No ingestion sources found.</Table.Cell>
					</Table.Row>
				{/if}
			</Table.Body>
		</Table.Root>
	</div>
</div>

<Dialog.Root bind:open={isDialogOpen}>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>{selectedSource ? 'Edit' : 'Create'} Ingestion Source</Dialog.Title>
			<Dialog.Description>
				{selectedSource
					? 'Make changes to your ingestion source here.'
					: 'Add a new ingestion source to start archiving emails.'}
			</Dialog.Description>
		</Dialog.Header>
		<IngestionSourceForm source={selectedSource} onSubmit={handleFormSubmit} />
	</Dialog.Content>
</Dialog.Root>
