import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
	const nonce = crypto.randomUUID();
	const isDev = process.env.NODE_ENV !== 'production';

	const csp = [
		`default-src 'self'`,
		`script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''} https://va.vercel-scripts.com`,
		`style-src 'self' 'unsafe-inline'`,
		`img-src 'self' https://images.unsplash.com https://images.lumacdn.com https://luma.com https://lu.ma https://pbs.twimg.com https://abs.twimg.com data: blob:`,
		`font-src 'self'`,
		`connect-src 'self' https://vitals.vercel-insights.com https://luma.com https://lu.ma`,
		`media-src 'self' https://video.twimg.com`,
		`frame-src https://luma.com https://lu.ma`,
		`frame-ancestors 'none'`,
		`object-src 'none'`,
		`base-uri 'self'`,
		`form-action 'self'`,
		`upgrade-insecure-requests`,
	].join('; ');

	const requestHeaders = new Headers(request.headers);
	requestHeaders.set('x-nonce', nonce);
	requestHeaders.set('Content-Security-Policy', csp);

	const response = NextResponse.next({
		request: { headers: requestHeaders },
	});
	response.headers.set('Content-Security-Policy', csp);

	return response;
}

export const config = {
	matcher: [
		{
			source: '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
			missing: [
				{ type: 'header', key: 'next-router-prefetch' },
				{ type: 'header', key: 'purpose', value: 'prefetch' },
			],
		},
	],
};
