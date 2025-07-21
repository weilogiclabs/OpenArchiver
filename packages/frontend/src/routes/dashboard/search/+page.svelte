<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import {
		Card,
		CardContent,
		CardHeader,
		CardTitle,
		CardDescription
	} from '$lib/components/ui/card';
	import { onMount } from 'svelte';
	import { Skeleton } from '$lib/components/ui/skeleton';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const searchResult = form?.searchResult ?? data.searchResult;
	const query = form?.query ?? data.query;
	const error = form?.error;

	let isMounted = $state(false);
	onMount(() => {
		isMounted = true;
	});

	function shadowRender(node: HTMLElement, html: string | undefined) {
		if (html === undefined) return;

		const shadow = node.attachShadow({ mode: 'open' });
		const style = document.createElement('style');
		style.textContent = `em { background-color: #fde047; font-style: normal; color: #1f2937; }`; // yellow-300, gray-800
		shadow.appendChild(style);
		const content = document.createElement('div');
		content.innerHTML = html;
		shadow.appendChild(content);

		return {
			update(newHtml: string | undefined) {
				if (newHtml === undefined) return;
				content.innerHTML = newHtml;
			}
		};
	}

	function getHighlightedSnippets(text: string | undefined, snippetLength = 80): string[] {
		if (!text || !text.includes('<em>')) {
			return [];
		}

		const snippets: string[] = [];
		const regex = /<em>.*?<\/em>/g;
		let match;
		let lastIndex = 0;

		while ((match = regex.exec(text)) !== null) {
			if (match.index < lastIndex) {
				continue;
			}

			const matchIndex = match.index;
			const matchLength = match[0].length;

			const start = Math.max(0, matchIndex - snippetLength);
			const end = Math.min(text.length, matchIndex + matchLength + snippetLength);

			lastIndex = end;

			let snippet = text.substring(start, end);

			// Then, balance them
			const openCount = (snippet.match(/<em/g) || []).length;
			const closeCount = (snippet.match(/<\/em>/g) || []).length;

			if (openCount > closeCount) {
				snippet += '</em>';
			}

			if (closeCount > openCount) {
				snippet = '<em>' + snippet;
			}

			// Finally, add ellipsis
			if (start > 0) {
				snippet = '...' + snippet;
			}
			if (end < text.length) {
				snippet += '...';
			}

			snippets.push(snippet);
		}

		return snippets;
	}
</script>

<svelte:head>
	<title>Search | Open Archiver</title>
	<meta name="description" content="Search for archived emails." />
</svelte:head>

<div class="container mx-auto p-4 md:p-8">
	<h1 class="mb-4 text-2xl font-bold">Email Search</h1>

	<form method="POST" action="/dashboard/search" class="mb-8 flex items-center gap-2">
		<Input
			type="search"
			name="query"
			placeholder="Search by keyword, sender, recipient..."
			class="flex-grow"
			value={query}
		/>
		<Button type="submit">Search</Button>
	</form>

	{#if error}
		<p class="text-red-500">{error}</p>
	{/if}

	{#if searchResult}
		<p class="text-muted-foreground mb-4">
			{#if searchResult.total > 0}
				Found {searchResult.total} results in {searchResult.hits.length / 1000}s
			{:else}
				Found {searchResult.total} results
			{/if}
		</p>

		<div class="grid gap-4">
			{#each searchResult.hits as hit}
				{@const _formatted = hit._formatted || {}}
				<a href="/dashboard/archived-emails/{hit.id}" class="block">
					<Card>
						<CardHeader>
							<CardTitle>
								{#if !isMounted}
									<Skeleton class="h-6 w-3/4" />
								{:else}
									<div use:shadowRender={_formatted.subject || hit.subject}></div>
								{/if}
							</CardTitle>
							<CardDescription class="flex items-center space-x-1">
								<span>From:</span>
								{#if !isMounted}
									<span class="bg-accent h-4 w-40 animate-pulse rounded-md"></span>
								{:else}
									<span class="inline-block" use:shadowRender={_formatted.from || hit.from}></span>
								{/if}
								<span class="mx-2">|</span>
								<span>To:</span>
								{#if !isMounted}
									<span class="bg-accent h-4 w-40 animate-pulse rounded-md"></span>
								{:else}
									<span
										class="inline-block"
										use:shadowRender={_formatted.to?.join(', ') || hit.to.join(', ')}
									></span>
								{/if}
								<span class="mx-2">|</span>
								{#if !isMounted}
									<span class="bg-accent h-4 w-40 animate-pulse rounded-md"></span>
								{:else}
									<span class="inline-block">
										{new Date(hit.timestamp).toLocaleString()}
									</span>
								{/if}
							</CardDescription>
						</CardHeader>
						<CardContent class="space-y-2">
							<!-- Body matches -->
							{#if _formatted.body}
								{#each getHighlightedSnippets(_formatted.body) as snippet}
									<div class="space-y-2 rounded-md bg-slate-100 p-2 dark:bg-slate-800">
										<p class="text-sm text-gray-500">In email body:</p>
										{#if !isMounted}
											<Skeleton class="my-2 h-5 w-full bg-gray-200" />
										{:else}
											<p class="font-mono text-sm" use:shadowRender={snippet}></p>
										{/if}
									</div>
								{/each}
							{/if}

							<!-- Attachment matches -->
							{#if _formatted.attachments}
								{#each _formatted.attachments as attachment, i}
									{#if attachment && attachment.content}
										{#each getHighlightedSnippets(attachment.content) as snippet}
											<div class="space-y-2 rounded-md bg-slate-100 p-2 dark:bg-slate-800">
												<p class="text-sm text-gray-500">
													In attachment: {attachment.filename}
												</p>
												{#if !isMounted}
													<Skeleton class="my-2 h-5 w-full bg-gray-200" />
												{:else}
													<p class="font-mono text-sm" use:shadowRender={snippet}></p>
												{/if}
											</div>
										{/each}
									{/if}
								{/each}
							{/if}
						</CardContent>
					</Card>
				</a>
			{/each}
		</div>
	{/if}
</div>
