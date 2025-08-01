<script lang="ts">
	import type { IngestionSource, CreateIngestionSourceDto } from '@open-archiver/types';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';

	let {
		source = null,
		onSubmit
	}: {
		source?: IngestionSource | null;
		onSubmit: (data: CreateIngestionSourceDto) => Promise<void>;
	} = $props();

	const providerOptions = [
		{ value: 'generic_imap', label: 'Generic IMAP' },
		{ value: 'google_workspace', label: 'Google Workspace' },
		{ value: 'microsoft_365', label: 'Microsoft 365' }
	];

	let formData: CreateIngestionSourceDto = $state({
		name: source?.name ?? '',
		provider: source?.provider ?? 'generic_imap',
		providerConfig: source?.credentials ?? {
			type: source?.provider ?? 'generic_imap',
			secure: true
		}
	});

	$effect(() => {
		formData.providerConfig.type = formData.provider;
		console.log(formData);
	});

	const triggerContent = $derived(
		providerOptions.find((p) => p.value === formData.provider)?.label ?? 'Select a provider'
	);

	let isSubmitting = $state(false);

	const handleSubmit = async (event: Event) => {
		event.preventDefault();
		isSubmitting = true;
		try {
			await onSubmit(formData);
		} finally {
			isSubmitting = false;
		}
	};
</script>

<form onsubmit={handleSubmit} class="grid gap-4 py-4">
	<div class="grid grid-cols-4 items-center gap-4">
		<Label for="name" class="text-left">Name</Label>
		<Input id="name" bind:value={formData.name} class="col-span-3" />
	</div>
	<div class="grid grid-cols-4 items-center gap-4">
		<Label for="provider" class="text-left">Provider</Label>
		<Select.Root name="provider" bind:value={formData.provider} type="single">
			<Select.Trigger class="col-span-3">
				{triggerContent}
			</Select.Trigger>
			<Select.Content>
				{#each providerOptions as option}
					<Select.Item value={option.value}>{option.label}</Select.Item>
				{/each}
			</Select.Content>
		</Select.Root>
	</div>

	{#if formData.provider === 'google_workspace'}
		<div class="grid grid-cols-4 items-center gap-4">
			<Label for="serviceAccountKeyJson" class="text-left">Service Account Key (JSON)</Label>
			<Textarea
				placeholder="Paste your service account key JSON content"
				id="serviceAccountKeyJson"
				bind:value={formData.providerConfig.serviceAccountKeyJson}
				class="col-span-3 max-h-32"
			/>
		</div>
		<div class="grid grid-cols-4 items-center gap-4">
			<Label for="impersonatedAdminEmail" class="text-left">Impersonated Admin Email</Label>
			<Input
				id="impersonatedAdminEmail"
				bind:value={formData.providerConfig.impersonatedAdminEmail}
				class="col-span-3"
			/>
		</div>
	{:else if formData.provider === 'microsoft_365'}
		<div class="grid grid-cols-4 items-center gap-4">
			<Label for="clientId" class="text-left">Application (Client) ID</Label>
			<Input id="clientId" bind:value={formData.providerConfig.clientId} class="col-span-3" />
		</div>
		<div class="grid grid-cols-4 items-center gap-4">
			<Label for="clientSecret" class="text-left">Client Secret Value</Label>
			<Input
				id="clientSecret"
				type="password"
				placeholder="Enter the secret Value, not the Secret ID"
				bind:value={formData.providerConfig.clientSecret}
				class="col-span-3"
			/>
		</div>
		<div class="grid grid-cols-4 items-center gap-4">
			<Label for="tenantId" class="text-left">Directory (Tenant) ID</Label>
			<Input id="tenantId" bind:value={formData.providerConfig.tenantId} class="col-span-3" />
		</div>
	{:else if formData.provider === 'generic_imap'}
		<div class="grid grid-cols-4 items-center gap-4">
			<Label for="host" class="text-left">Host</Label>
			<Input id="host" bind:value={formData.providerConfig.host} class="col-span-3" />
		</div>
		<div class="grid grid-cols-4 items-center gap-4">
			<Label for="port" class="text-left">Port</Label>
			<Input id="port" type="number" bind:value={formData.providerConfig.port} class="col-span-3" />
		</div>
		<div class="grid grid-cols-4 items-center gap-4">
			<Label for="username" class="text-left">Username</Label>
			<Input id="username" bind:value={formData.providerConfig.username} class="col-span-3" />
		</div>
		<div class="grid grid-cols-4 items-center gap-4">
			<Label for="password" class="text-left">Password</Label>
			<Input
				id="password"
				type="password"
				bind:value={formData.providerConfig.password}
				class="col-span-3"
			/>
		</div>
		<div class="grid grid-cols-4 items-center gap-4">
			<Label for="secure" class="text-left">Use TLS</Label>
			<Checkbox id="secure" bind:checked={formData.providerConfig.secure} />
		</div>
	{/if}
	{#if formData.provider === 'google_workspace' || formData.provider === 'microsoft_365'}
		<Alert.Root>
			<Alert.Title>Heads up!</Alert.Title>
			<Alert.Description>
				<div class="my-1">
					Please note that this is an organization-wide operation. This kind of ingestions will
					import and index <b>all</b> email inboxes in your organization. If you want to import only
					specific email inboxes, use the IMAP connector.
				</div>
			</Alert.Description>
		</Alert.Root>
	{/if}
	<Dialog.Footer>
		<Button type="submit" disabled={isSubmitting}>
			{#if isSubmitting}
				Submitting...
			{:else}
				Submit
			{/if}
		</Button>
	</Dialog.Footer>
</form>
