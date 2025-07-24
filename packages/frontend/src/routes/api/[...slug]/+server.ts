import { env } from '$env/dynamic/private';
import type { RequestHandler } from '@sveltejs/kit';

const BACKEND_URL = `http://localhost:${env.PORT_BACKEND || 4000}`;

const handleRequest: RequestHandler = async ({ request, params }) => {
    const url = new URL(request.url);
    const slug = params.slug || '';
    const targetUrl = `${BACKEND_URL}/${slug}${url.search}`;

    // Create a new request with the same method, headers, and body
    const proxyRequest = new Request(targetUrl, {
        method: request.method,
        headers: request.headers,
        body: request.body,
        duplex: 'half' // Required for streaming request bodies
    } as RequestInit);

    // Forward the request to the backend
    const response = await fetch(proxyRequest);

    // Return the response from the backend
    return response;
};

export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const PATCH = handleRequest;
export const DELETE = handleRequest;
