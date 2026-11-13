/** @type {import('next').NextConfig} */
const securityHeaders = [
	{ key: 'X-Content-Type-Options', value: 'nosniff' },
	// Kept alongside CSP frame-ancestors for backward compatibility with older browsers
	{ key: 'X-Frame-Options', value: 'DENY' },
	{ key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
	{
		key: 'Permissions-Policy',
		value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), bluetooth=()',
	},
	{
		key: 'Strict-Transport-Security',
		value: 'max-age=63072000; includeSubDomains; preload',
	},
	// unsafe-none allows third-party iframes (e.g. LumaCalendar embed) to load
	{ key: 'Cross-Origin-Opener-Policy', value: 'unsafe-none' },
	{ key: 'Cross-Origin-Resource-Policy', value: 'cross-origin' },
	{ key: 'Cross-Origin-Embedder-Policy', value: 'unsafe-none' },
];

const nextConfig = {
	allowedDevOrigins: ['127.0.0.1'],
	async headers() {
		return [
			{
				source: '/(.*)',
				headers: securityHeaders,
			},
		];
	},
	async redirects() {
		return [
			{
				source: '/slides/1',
				destination: '/slides',
				permanent: true,
			},
			{
				source: '/claim',
				destination: '/creditos',
				permanent: false,
			},
		];
	},
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'images.unsplash.com',
			},
			{
				protocol: 'https',
				hostname: 'images.lumacdn.com',
			},
			{
				protocol: 'https',
				hostname: 'pbs.twimg.com',
			},
			{
				protocol: 'https',
				hostname: 'abs.twimg.com',
			},
		],
	},
};

module.exports = nextConfig;
