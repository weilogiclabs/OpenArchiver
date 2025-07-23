<script lang="ts">
	import type { PageData } from './$types';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import * as Chart from '$lib/components/ui/chart/index.js';
	import { BarChart, PieChart, LineChart } from 'layerchart';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { Badge } from '$lib/components/ui/badge';

	export let data: PageData;

	const { stats, ingestionHistory, ingestionSources, recentSyncs } = data;

	const chartConfig = {
		storageUsed: {
			label: 'Storage Used'
		},
		count: {
			label: 'Emails'
		}
	} satisfies Chart.ChartConfig;

	const formatBytes = (bytes: number, decimals = 2) => {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const dm = decimals < 0 ? 0 : decimals;
		const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
	};
</script>

<svelte:head>
	<title>Dashboard - OpenArchiver</title>
	<meta name="description" content="System health and activity overview." />
</svelte:head>

<div class="container mx-auto">
	<h1 class="mb-6 text-3xl font-bold">Dashboard</h1>

	<!-- Ingestion Overview -->
	<section class="mb-8">
		<h2 class="mb-4 text-2xl font-semibold">Ingestion Overview</h2>
		<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			{#await stats}
				<p>Loading stats...</p>
			{:then statsData}
				{#if statsData}
					<Card>
						<CardHeader>
							<CardTitle>Total Emails Archived</CardTitle>
						</CardHeader>
						<CardContent>
							<p class="text-4xl font-bold">{statsData.totalEmailsArchived.toLocaleString()}</p>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle>Total Storage Used</CardTitle>
						</CardHeader>
						<CardContent>
							<p class="text-4xl font-bold">{formatBytes(statsData.totalStorageUsed)}</p>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle>Failed Ingestions (7 days)</CardTitle>
						</CardHeader>
						<CardContent>
							<p
								class="text-4xl font-bold"
								class:text-red-500={statsData.failedIngestionsLast7Days > 0}
							>
								{statsData.failedIngestionsLast7Days}
							</p>
						</CardContent>
					</Card>
				{/if}
			{/await}
		</div>
	</section>

	<!-- Charts -->
	<section class="mb-8 grid gap-8 md:grid-cols-2">
		<Card>
			<CardHeader>
				<CardTitle>Emails Archived (Last 30 Days)</CardTitle>
			</CardHeader>
			<CardContent>
				{#await ingestionHistory}
					<p>Loading chart...</p>
				{:then historyData}
					{#if historyData}
						<div class="h-64">
							<Chart.Container config={chartConfig}>
								<LineChart data={historyData.history} x="date" y="count" />
							</Chart.Container>
						</div>
					{/if}
				{/await}
			</CardContent>
		</Card>
		<Card>
			<CardHeader>
				<CardTitle>Storage Usage by Source</CardTitle>
			</CardHeader>
			<CardContent>
				{#await ingestionSources}
					<p>Loading chart...</p>
				{:then sourceData}
					{#if sourceData}
						<div class="h-64">
							<Chart.Container config={chartConfig}>
								<PieChart
									data={sourceData}
									key="id"
									label="name"
									value="storageUsed"
									innerRadius={0.5}
								/>
							</Chart.Container>
						</div>
					{/if}
				{/await}
			</CardContent>
		</Card>
	</section>

	<!-- Ingestion Source Status -->
	<section class="mb-8">
		<h2 class="mb-4 text-2xl font-semibold">Ingestion Source Status</h2>
		<Card>
			<CardContent>
				{#await ingestionSources}
					<p>Loading sources...</p>
				{:then sourceData}
					{#if sourceData}
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Name</TableHead>
									<TableHead>Provider</TableHead>
									<TableHead>Status</TableHead>
									<TableHead class="text-right">Storage Used</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{#each sourceData as source}
									<TableRow>
										<TableCell>{source.name}</TableCell>
										<TableCell>{source.provider}</TableCell>
										<TableCell>
											<Badge
												class={source.status === 'Active'
													? 'bg-green-500'
													: source.status === 'Error'
														? 'bg-red-500'
														: 'bg-gray-500'}
											>
												{source.status}
											</Badge>
										</TableCell>
										<TableCell class="text-right">{formatBytes(source.storageUsed)}</TableCell>
									</TableRow>
								{/each}
							</TableBody>
						</Table>
					{/if}
				{/await}
			</CardContent>
		</Card>
	</section>

	<!-- Recent Sync Jobs -->
	<section>
		<h2 class="mb-4 text-2xl font-semibold">Recent Sync Jobs</h2>
		<Card>
			<CardContent>
				{#await recentSyncs}
					<p>Loading syncs...</p>
				{:then syncData}
					{#if syncData && syncData.length > 0}
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Source</TableHead>
									<TableHead>Start Time</TableHead>
									<TableHead>Duration</TableHead>
									<TableHead>Emails Processed</TableHead>
									<TableHead>Status</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{#each syncData as sync}
									<TableRow>
										<TableCell>{sync.sourceName}</TableCell>
										<TableCell>{new Date(sync.startTime).toLocaleString()}</TableCell>
										<TableCell>{sync.duration}s</TableCell>
										<TableCell>{sync.emailsProcessed}</TableCell>
										<TableCell>
											<Badge class={sync.status === 'Completed' ? 'bg-green-500' : 'bg-red-500'}>
												{sync.status}
											</Badge>
										</TableCell>
									</TableRow>
								{/each}
							</TableBody>
						</Table>
					{:else}
						<p class="p-4 text-center">No recent sync jobs found.</p>
					{/if}
				{/await}
			</CardContent>
		</Card>
	</section>
</div>
