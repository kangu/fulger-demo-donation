<script>
    export let value = 0

    $: leftDigits = () => {
        // target minimum numberi s 9
        let result = ''
        const satsLen = Math.round(value).toFixed().length
        if (satsLen < 9) {
            const needToAdd = 9 - satsLen
            result = '0.'
            for (let i = 0; i < needToAdd - 1; i++) {
                result += '0'
            }
        }
        return result
    }

    $: stringValue = Math.round(value).toFixed()
    $: valueLength = Math.round(value).toFixed().length
    $: leftLength = leftDigits().length
</script>

<section>
    <span data-left data-digits={leftLength}>
        {#each leftDigits() as code, i}
            <span>{code}</span>
        {/each}
    </span>
    <span data-right data-digits={valueLength} data-whole-coin={valueLength >= 9}>
        {#each stringValue as code, i}
            <span>{code}</span>
        {/each}
    </span>
    <!--{leftLength}-->
</section>

<style>
    :root {
        --padding-thousands: 5px;
    }
    section {
        display: inline-flex;
        font-family: var(--font-mono);
        font-size: 20px;
        font-weight: 600;
    }
    [data-left] {
        color: var(--color-light);
    }

    [data-right] :nth-last-child(3),
    [data-right] :nth-last-child(6) {
        margin-left: var(--padding-thousands);
    }

    [data-left][data-digits="0"] {
        display: none;
    }

    [data-left][data-digits="9"] :nth-last-child(3),
    [data-left][data-digits="9"] :nth-last-child(6),
    [data-left][data-digits="8"] :nth-last-child(2),
    [data-left][data-digits="8"] :nth-last-child(5),
    [data-left][data-digits="7"] :nth-last-child(4),
    [data-left][data-digits="6"] :nth-last-child(3),
    [data-left][data-digits="5"] :nth-last-child(1) {
        margin-left: var(--padding-thousands);
    }

    [data-whole-coin="true"] :nth-last-child(8):before {
        content: ".";
    }

</style>
