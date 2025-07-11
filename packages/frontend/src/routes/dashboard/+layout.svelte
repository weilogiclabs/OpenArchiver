<script lang="ts">
	import * as NavigationMenu from '$lib/components/ui/navigation-menu/index.js';
	import Button from '$lib/components/ui/button/button.svelte';
	import { authStore } from '$lib/stores/auth.store';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	const navItems = [
		{ href: '/dashboard', label: 'Dashboard' },
		{ href: '/dashboard/ingestions', label: 'Ingestions' }
	];
	let { children } = $props();
	function handleLogout() {
		authStore.logout();
		goto('/signin');
	}
</script>

<header class="bg-background sticky top-0 z-40 border-b">
	<div class="container mx-auto flex h-16 flex-row items-center justify-between">
		<a href="/dashboard" class="text-primary text-lg font-semibold"> OpenArchive </a>
		<NavigationMenu.Root>
			<NavigationMenu.List class="flex items-center space-x-4">
				{#each navItems as item}
					<NavigationMenu.Item
						class={page.url.pathname === item.href ? 'bg-accent rounded-md' : ''}
					>
						<NavigationMenu.Link href={item.href}>
							{item.label}
						</NavigationMenu.Link>
					</NavigationMenu.Item>
				{/each}
			</NavigationMenu.List>
		</NavigationMenu.Root>
		<Button onclick={handleLogout} variant="outline">Logout</Button>
	</div>
</header>

<main class="container mx-auto my-10">
	{@render children()}
</main>
