<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { api } from '$lib/api.client';
	import { authStore } from '$lib/stores/auth.store';
	import type { LoginResponse } from '@open-archive/types';

	let email = '';
	let password = '';
	let error: string | null = null;
	let isLoading = false;

	async function handleSubmit() {
		isLoading = true;
		error = null;
		try {
			const response = await api('/auth/login', {
				method: 'POST',
				body: JSON.stringify({ email, password })
			});
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to login');
			}

			const loginData: LoginResponse = await response.json();
			authStore.login(loginData.accessToken, loginData.user);
			// Redirect to a protected page after login
			goto('/dashboard');
		} catch (e: any) {
			error = e.message;
		} finally {
			isLoading = false;
		}
	}
</script>

<svelte:head>
	<title>Login - OpenArchive</title>
	<meta name="description" content="Login to your OpenArchive account." />
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
	<Card.Root class="w-full max-w-md">
		<Card.Header class="space-y-1">
			<Card.Title class="text-2xl">Login</Card.Title>
			<Card.Description>Enter your email below to login to your account.</Card.Description>
		</Card.Header>
		<Card.Content class="grid gap-4">
			<form onsubmit={handleSubmit} class="grid gap-4">
				<div class="grid gap-2">
					<Label for="email">Email</Label>
					<Input id="email" type="email" placeholder="m@example.com" bind:value={email} required />
				</div>
				<div class="grid gap-2">
					<Label for="password">Password</Label>
					<Input id="password" type="password" bind:value={password} required />
				</div>

				{#if error}
					<p class="mt-2 text-sm text-red-600">{error}</p>
				{/if}

				<Button type="submit" class=" w-full" disabled={isLoading}>
					{isLoading ? 'Logging in...' : 'Login'}
				</Button>
			</form>
		</Card.Content>
	</Card.Root>
</div>
