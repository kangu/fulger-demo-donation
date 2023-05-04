# create-svelte

Everything you need to build a Svelte project, powered by [`create-svelte`](https://github.com/sveltejs/kit/tree/master/packages/create-svelte).

## Added files

The following files have been added to the template:

`src/lib/fulger.js` - API for [Fulger backend](fulger.kangu.ro)

`src/lib/language_currencies.js` - json object matching language locales (from `navigation.language`) to local currency codes

`src/lib/form.js` - handles form submission through a [fetch request](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://kit.svelte.dev/docs/adapters) for your target environment.
