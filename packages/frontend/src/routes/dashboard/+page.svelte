<script lang="ts">
	import { authStore } from '$lib/stores/auth.store';
	import { Button } from '$lib/components/ui/button';
	import { goto } from '$app/navigation';

	function handleLogout() {
		authStore.logout();
		goto('/signin');
	}
</script>

<svelte:head>
	<title>Dashboard - OpenArchive</title>
</svelte:head>

<div class="p-8">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold">Dashboard</h1>
		<Button onclick={handleLogout}>Logout</Button>
	</div>
	<p class="mt-4">Welcome, {$authStore.user?.email}!</p>
	<p>You are logged in.</p>
</div>
