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
	import type { SearchResult } from '@open-archiver/types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const searchResult = form?.searchResult ?? data.searchResult;
	console.log(searchResult);
	const query = form?.query ?? data.query;
	const error = form?.error;

	function escapeHTML(text: string) {
		if (!text) return '';
		return text
			.replace(/&/g, '&')
			.replace(/</g, '<')
			.replace(/>/g, '>')
			.replace(/"/g, '"')
			.replace(/'/g, '&#039;')
			.replace('<html', '')
			.replace('</html>', '');
	}

	function getHighlightedHTMLFormatted(formatted: SearchResult['hits']) {}

	function getHighlightedHTML(
		text: string,
		positions: { start: number; length: number }[]
	): string {
		if (!text || !positions) {
			return text;
		}

		// sort positions by start index
		positions.sort((a, b) => a.start - b.start);

		let highlighted = '';
		let lastIndex = 0;
		positions.forEach(({ start, length }) => {
			highlighted += escapeHTML(text.substring(lastIndex, start));
			highlighted += `<mark class="bg-yellow-300 dark:bg-yellow-600">${escapeHTML(
				text.substring(start, start + length)
			)}</mark>`;
			lastIndex = start + length;
		});
		highlighted += escapeHTML(text.substring(lastIndex));
		return highlighted;
	}

	function getSnippets(
		text: string,
		positions: { start: number; length: number }[],
		contextLength = 50
	) {
		if (!text || !positions) {
			return [];
		}

		// sort positions by start index
		positions.sort((a, b) => a.start - b.start);

		const snippets: string[] = [];
		let lastEnd = -1;

		for (const { start, length } of positions) {
			if (start < lastEnd) {
				// Skip overlapping matches to avoid duplicate snippets
				continue;
			}

			const snippetStart = Math.max(0, start - contextLength);
			const snippetEnd = Math.min(text.length, start + length + contextLength);
			lastEnd = snippetEnd;

			let snippet = text.substring(snippetStart, snippetEnd);

			// Adjust positions to be relative to the snippet
			const relativeStart = start - snippetStart;
			const relativePositions = [{ start: relativeStart, length }];

			let highlightedSnippet = getHighlightedHTML(snippet, relativePositions);

			if (snippetStart > 0) {
				highlightedSnippet = '...' + highlightedSnippet;
			}
			if (snippetEnd < text.length) {
				highlightedSnippet += '...';
			}

			snippets.push(highlightedSnippet);
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
				{@const _matchesPosition = hit._matchesPosition || {}}
				<a href="/dashboard/archived-emails/{hit.id}" class="block">
					<Card>
						<CardHeader>
							<CardTitle>
								{@html getHighlightedHTML(hit.subject, _matchesPosition.subject)}
							</CardTitle>
							<CardDescription>
								From: {@html getHighlightedHTML(hit.from, _matchesPosition.from)} | To:
								{@html getHighlightedHTML(hit.to.join(', '), _matchesPosition.to)}
								|
								{new Date(hit.timestamp).toLocaleString()}
							</CardDescription>
						</CardHeader>
						<CardContent class="space-y-2">
							<!-- Body matches -->
							{#if _matchesPosition.body}
								{#each getSnippets(hit.body, _matchesPosition.body) as snippet}
									<div class="space-y-2 rounded-md bg-slate-100 p-2 dark:bg-slate-800">
										<p class="text-sm text-gray-500">In email body:</p>
										<p class="font-mono text-sm">
											{@html snippet}
										</p>
									</div>
								{/each}
							{/if}

							<!-- Attachment matches -->
							{#if _matchesPosition['attachments.content']}
								{#each _matchesPosition['attachments.content'] as match}
									{#if match.indices}
										{@const attachmentIndex = match.indices[0]}
										{@const attachment = hit.attachments[attachmentIndex]}
										{#if attachment}
											{#each getSnippets(attachment.content, [match]) as snippet}
												<div class="space-y-2 rounded-md bg-slate-100 p-2 dark:bg-slate-800">
													<p class="text-sm text-gray-500">
														In attachment: {attachment.filename}
													</p>
													<p class="font-mono text-sm">
														{@html snippet}
													</p>
												</div>
											{/each}
										{/if}
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
