<script lang="ts">
	import '../app.css';
	import { authStore } from '$lib/stores/auth.store';
	import { theme } from '$lib/stores/theme.store';
	import { browser } from '$app/environment';
	import Footer from '$lib/components/custom/Footer.svelte';

	let { data, children } = $props();

	$effect(() => {
		authStore.syncWithServer(data.user, data.accessToken);
	});

	$effect(() => {
		if (browser) {
			const isDark =
				$theme === 'dark' ||
				($theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
			document.documentElement.classList.toggle('dark', isDark);
		}
	});
</script>

<div class="flex min-h-screen flex-col">
	<main class="flex-1">
		{@render children()}
	</main>
	<Footer />
</div>
