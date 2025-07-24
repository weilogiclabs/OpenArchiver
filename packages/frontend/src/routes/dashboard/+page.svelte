<script lang="ts">
	import type { PageData } from './$types';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Chart from '$lib/components/ui/chart/index.js';
	import { BarChart } from 'layerchart';
	import { formatBytes } from '$lib/utils';

	let { data }: { data: PageData } = $props();

	const chartConfig = {
		count: {
			label: 'Emails Ingested',
			color: '#2563eb'
		}
	} satisfies Chart.ChartConfig;
</script>

<svelte:head>
	<title>Dashboard - OpenArchiver</title>
	<meta name="description" content="Overview of your email archive." />
</svelte:head>

<div class="flex-1 space-y-4 p-8 pt-6">
	<div class="flex items-center justify-between space-y-2">
		<h2 class="text-3xl font-bold tracking-tight">Dashboard</h2>
	</div>

	{#if data.stats}
		<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			<Card.Root>
				<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
					<Card.Title class="text-sm font-medium">Total Emails Archived</Card.Title>
				</Card.Header>
				<Card.Content>
					<div class="text-2xl font-bold">{data.stats.totalEmailsArchived}</div>
				</Card.Content>
			</Card.Root>
			<Card.Root>
				<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
					<Card.Title class="text-sm font-medium">Total Storage Used</Card.Title>
				</Card.Header>
				<Card.Content>
					<div class="text-2xl font-bold">{formatBytes(data.stats.totalStorageUsed)}</div>
				</Card.Content>
			</Card.Root>
			<Card.Root>
				<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
					<Card.Title class="text-sm font-medium">Failed Ingestions (Last 7 Days)</Card.Title>
				</Card.Header>
				<Card.Content>
					<div class="text-2xl font-bold">{data.stats.failedIngestionsLast7Days}</div>
				</Card.Content>
			</Card.Root>
		</div>
	{/if}

	<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
		<Card.Root class="col-span-4">
			<Card.Header>
				<Card.Title>Ingestion History</Card.Title>
			</Card.Header>
			<Card.Content class="pl-2">
				{#if data.ingestionHistory && data.ingestionHistory.history.length > 0}
					<Chart.Container config={chartConfig} class="min-h-[200px] w-full">
						<BarChart
							data={data.ingestionHistory.history}
							x="date"
							y="count"
							axis="x"
							seriesLayout="group"
							props={{
								xAxis: {
									format: (d) =>
										new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
								}
							}}
						>
							{#snippet tooltip()}
								<Chart.Tooltip />
							{/snippet}
						</BarChart>
					</Chart.Container>
				{:else}
					<p>No ingestion history available.</p>
				{/if}
			</Card.Content>
		</Card.Root>

		<Card.Root class="col-span-3">
			<Card.Header>
				<Card.Title>Recent Syncs</Card.Title>
				<Card.Description>Most recent sync activities.</Card.Description>
			</Card.Header>
			<Card.Content>
				{#if data.recentSyncs && data.recentSyncs.length > 0}
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Source</Table.Head>
								<Table.Head>Status</Table.Head>
								<Table.Head>Processed</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each data.recentSyncs as sync}
								<Table.Row>
									<Table.Cell class="font-medium">{sync.sourceName}</Table.Cell>
									<Table.Cell>{sync.status}</Table.Cell>
									<Table.Cell>{sync.emailsProcessed}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				{:else}
					<p>No recent syncs.</p>
				{/if}
			</Card.Content>
		</Card.Root>
	</div>

	<Card.Root>
		<Card.Header>
			<Card.Title>Ingestion Sources</Card.Title>
			<Card.Description>Overview of your ingestion sources.</Card.Description>
		</Card.Header>
		<Card.Content>
			{#if data.ingestionSources && data.ingestionSources.length > 0}
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Name</Table.Head>
							<Table.Head>Provider</Table.Head>
							<Table.Head>Status</Table.Head>
							<Table.Head class="text-right">Storage Used</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each data.ingestionSources as source}
							<Table.Row>
								<Table.Cell class="font-medium">{source.name}</Table.Cell>
								<Table.Cell>{source.provider}</Table.Cell>
								<Table.Cell>{source.status}</Table.Cell>
								<Table.Cell class="text-right">{formatBytes(source.storageUsed)}</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			{:else}
				<p>No ingestion sources found.</p>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
