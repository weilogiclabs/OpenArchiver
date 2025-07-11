<script lang="ts">
	import { authStore } from '$lib/stores/auth.store';
</script>

<svelte:head>
	<title>Dashboard - OpenArchive</title>
</svelte:head>

<div class="">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold">Dashboard</h1>
	</div>
	<p class="mt-4">Welcome, {$authStore.user?.email}!</p>
	<p>You are logged in.</p>
</div>
