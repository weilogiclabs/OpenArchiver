<script lang="ts">
	import * as Chart from '$lib/components/ui/chart/index.js';
	import { AreaChart } from 'layerchart';
	import { curveCatmullRom } from 'd3-shape';
	import type { ChartConfig } from '$lib/components/ui/chart';

	export let data: { date: Date; count: number }[];

	const chartConfig = {
		count: {
			label: 'Emails Ingested',
			color: 'var(--chart-1)'
		}
	} satisfies ChartConfig;
</script>

<Chart.Container config={chartConfig} class="min-h-[300px] w-full">
	<AreaChart
		{data}
		x="date"
		y="count"
		yDomain={[0, Math.max(...data.map((d) => d.count)) * 1.1]}
		axis
		legend={false}
		series={[
			{
				key: 'count',
				...chartConfig.count
			}
		]}
		cRange={[
			'var(--color-chart-1)',
			'var(--color-chart-2)',
			'var(--color-chart-3)',
			'var(--color-chart-4)',
			'var(--color-chart-5)'
		]}
		labels={{}}
		props={{
			xAxis: {
				format: (d) =>
					new Date(d).toLocaleDateString('en-US', {
						month: 'short',
						day: 'numeric'
					})
			},
			area: { curve: curveCatmullRom }
		}}
	>
		{#snippet tooltip()}
			<Chart.Tooltip />
		{/snippet}
	</AreaChart>
</Chart.Container>
