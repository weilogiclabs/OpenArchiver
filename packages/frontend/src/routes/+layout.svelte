<script lang="ts">
	import '../app.css';
	import { authStore } from '$lib/stores/auth.store';

	let { data, children } = $props();

	$effect(() => {
		authStore.syncWithServer(data.user, data.accessToken);
	});
</script>

{@render children()}
