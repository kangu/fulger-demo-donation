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
	<h1>
<!--		<span class="welcome">-->
<!--			<picture>-->
<!--				<source srcset={welcome} type="image/webp" />-->
<!--				<img src={welcome_fallback} alt="Welcome" />-->
<!--			</picture>-->
<!--		</span>-->

		donate sats to<br/> support our development team <br/> building open source tooling
	</h1>

	<SatsDonation
			startingValue="10000"/>

</section>

<style>
	section {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		flex: 0.6;
	}

	h1 {
		width: 100%;
	}

	.welcome {
		display: block;
		position: relative;
		width: 100%;
		height: 0;
		padding: 0 0 calc(100% * 495 / 2048) 0;
	}

	.welcome img {
		position: absolute;
		width: 100%;
		height: 100%;
		top: 0;
		display: block;
	}
</style>
