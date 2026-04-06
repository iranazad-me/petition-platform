import { TanStackDevtools } from "@tanstack/react-devtools";
import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import Footer from "../components/Footer";
import Header from "../components/Header";

import appCss from "../styles.css?url";

const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var
mode=(stored==='light'||stored==='dark'||stored==='auto')?stored:'auto';var
prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var
resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remo
ve('light','dark');root.classList.add(resolved);if(mode==='auto'){root.removeAttribute('data-theme')}else{root
.setAttribute('data-theme',mode)}root.style.colorScheme=resolved;}catch(e){}})();`;

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "پویش ایران آزاد",
			},
			{
				name: "description",
				content: "پویش ایران آزاد — صدای دانشجویان و مردم ایران برای آزادی.",
			},
		],
		links: [
			{
				rel: "icon",
				type: "image/svg+xml",
				href: "/favicon.svg?v=20260406",
			},
			{
				rel: "shortcut icon",
				type: "image/svg+xml",
				href: "/favicon.svg?v=20260406",
			},
			{
				rel: "icon",
				type: "image/png",
				href: "/logo192.png?v=20260406",
				sizes: "192x192",
			},
			{
				rel: "icon",
				type: "image/png",
				href: "/logo512.png?v=20260406",
				sizes: "512x512",
			},
			{
				rel: "icon",
				type: "image/x-icon",
				href: "/favicon.ico?v=20260406",
				sizes: "any",
			},
			{
				rel: "apple-touch-icon",
				href: "/logo192.png?v=20260406",
				sizes: "192x192",
			},
			{
				rel: "apple-touch-icon",
				href: "/logo512.png?v=20260406",
				sizes: "512x512",
			},
			{
				rel: "manifest",
				href: "/manifest.json?v=20260406",
			},
			{
				rel: "preload",
				href: "/fonts/IRANYekanX/IRANYekanX-Regular.woff2",
				as: "font",
				type: "font/woff2",
				crossOrigin: "anonymous",
			},
			{
				rel: "preload",
				href: "/fonts/IRANYekanX/IRANYekanX-Bold.woff2",
				as: "font",
				type: "font/woff2",
				crossOrigin: "anonymous",
			},
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
	}),
	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="fa" dir="rtl" suppressHydrationWarning>
			<head>
				{/* biome-ignore lint/security/noDangerouslySetInnerHtml: theme-init script prevents FOUC and contains no user input */}
				<script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
				<HeadContent />
			</head>
			<body className="font-sans antialiased">
				<Header />
				{children}
				<Footer />
				<TanStackDevtools
					config={{
						position: "bottom-left",
					}}
					plugins={[
						{
							name: "Tanstack Router",
							render: <TanStackRouterDevtoolsPanel />,
						},
					]}
				/>
				<Scripts />
			</body>
		</html>
	);
}
