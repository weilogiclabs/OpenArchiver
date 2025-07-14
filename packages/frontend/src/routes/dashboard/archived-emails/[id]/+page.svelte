<script lang="ts">
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import EmailPreview from '$lib/components/custom/EmailPreview.svelte';
	import { api } from '$lib/api.client';
	import { browser } from '$app/environment';

	let { data }: { data: PageData } = $props();
	const { email } = data;
	console.log(email);
	async function download(path: string, filename: string) {
		if (!browser) return;

		try {
			const response = await api(`/storage/download?path=${encodeURIComponent(path)}`);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = filename;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			a.remove();
		} catch (error) {
			console.error('Download failed:', error);
			// Optionally, show an error message to the user
		}
	}
</script>

{#if email}
	<div class="grid grid-cols-3 gap-6">
		<div class="col-span-2">
			<Card.Root>
				<Card.Header>
					<Card.Title>{email.subject || 'No Subject'}</Card.Title>
					<Card.Description>
						From: {email.senderName || email.senderEmail} | Sent: {new Date(
							email.sentAt
						).toLocaleString()}
					</Card.Description>
				</Card.Header>
				<Card.Content>
					<div class="space-y-4">
						<div>
							<h3 class="font-semibold">Recipients</h3>
							<p>To: {email.recipients.map((r) => r.email).join(', ')}</p>
						</div>
						<div>
							<h3 class="font-semibold">Email Preview</h3>
							<EmailPreview raw={email.raw} />
						</div>
						{#if email.attachments && email.attachments.length > 0}
							<div>
								<h3 class="font-semibold">Attachments</h3>
								<ul class="mt-2 space-y-2">
									{#each email.attachments as attachment}
										<li class="flex items-center justify-between rounded-md border p-2">
											<span>{attachment.filename} ({attachment.sizeBytes} bytes)</span>
											<Button
												variant="outline"
												size="sm"
												onclick={() => download(attachment.storagePath, attachment.filename)}
											>
												Download
											</Button>
										</li>
									{/each}
								</ul>
							</div>
						{/if}
					</div>
				</Card.Content>
			</Card.Root>
		</div>
		<div class="col-span-1">
			<Card.Root>
				<Card.Header>
					<Card.Title>Actions</Card.Title>
				</Card.Header>
				<Card.Content>
					<Button onclick={() => download(email.storagePath, `${email.subject || 'email'}.eml`)}
						>Download Email (.eml)</Button
					>
				</Card.Content>
			</Card.Root>
		</div>
	</div>
{:else}
	<p>Email not found.</p>
{/if}
