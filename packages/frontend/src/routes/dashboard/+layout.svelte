<script lang="ts">
	import * as NavigationMenu from '$lib/components/ui/navigation-menu/index.js';
	import Button from '$lib/components/ui/button/button.svelte';
	import { authStore } from '$lib/stores/auth.store';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import ThemeSwitcher from '$lib/components/custom/ThemeSwitcher.svelte';
	const navItems = [
		{ href: '/dashboard', label: 'Dashboard' },
		{ href: '/dashboard/ingestions', label: 'Ingestions' },
		{ href: '/dashboard/archived-emails', label: 'Archived emails' }
	];
	let { children } = $props();
	function handleLogout() {
		authStore.logout();
		goto('/signin');
	}
</script>

<header class="bg-background sticky top-0 z-40 border-b">
	<div class="container mx-auto flex h-16 flex-row items-center justify-between">
		<a href="/dashboard" class="text-primary flex flex-row items-center gap-2 font-bold">
			<img src="/logos/logo-sq.svg" alt="OpenArchive Logo" class="h-8 w-8" />
			<span>OpenArchive</span>
		</a>
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
		<div class="flex items-center gap-4">
			<ThemeSwitcher />
			<Button onclick={handleLogout} variant="outline">Logout</Button>
		</div>
	</div>
</header>

<main class="container mx-auto my-10">
	{@render children()}
</main>
