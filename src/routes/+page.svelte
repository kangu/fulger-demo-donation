<script>
	// import welcome from '$lib/images/svelte-welcome.webp';
	// import welcome_fallback from '$lib/images/svelte-welcome.png';
	import SatsDonation from "../components/SatsDonation.svelte";
</script>

<svelte:head>
	<title>Donate to Fulger development</title>
	<meta name="description" content="Demo app for donations over Lightning Network using Fulger tooling." />
</svelte:head>

<section>
	<div class="hero">
		<h1>
			Donate sats to<br/> support our development team <br/> building open source tooling
		</h1>
		<p>Check out the <a href="https://github.com/kangu/fulger-demo-donation" target="_blank">github repository</a> for the source code of this simple website built with Svelte and using
			the Fulger backend</p>
	</div>

	<SatsDonation
			startingValue="10000"/>

</section>

<style>
	section {
		display: flex;
		flex-direction: row;
		justify-content: space-around;
		align-items: center;
		flex: 0.6;
	}

	h1 {
		width: 100%;
		text-align: left;
		font-weight: 600;
	}

	.hero {
		max-width: 600px;
	}
</style>
