<script>
    import {processCurrentRates, watchForPaymentComplete, getCurrentPaymentRevision} from '$lib/fulger.js'
    import {copyToClipboard} from '$lib/clipboard.js'
    import currencyMatches from '$lib/language_currencies.js'
    import SatoshiDisplay from "./SatoshiDisplay.svelte";
    import {onMount, onDestroy} from 'svelte'
    import {enhance} from '$lib/form'

    export let startingValue = '1000'
    let finalValueInSats = parseInt(startingValue)
    let targetCurrency = 'sats'
    let workingValue = null
    let rates = {}
    let isSubmitting = false
    let isSuccess = false
    let isPaid = false
    let invoiceRev = null   // keeps track of changes to the document
    let invoiceDoc = {
        ln_invoice_req: '',
        ln_invoice_qr: ''
    }

    onMount(async () => {
        /* try to show donation amount in local currency, if available on the rates doc */
        const language = navigator.language
        targetCurrency = currencyMatches[language] || 'USD'

        await initializeRatesAndDefaultValues()

        // initialize new order
        const existingOrder = localStorage.getItem('active')
        const startRev = localStorage.getItem('start_rev')
        console.log('Matching', targetCurrency, finalValueInSats, JSON.parse(existingOrder))
        if (existingOrder !== null) {
            // resume existing order
            invoiceDoc = JSON.parse(existingOrder)
            isSuccess = true
            isPaid = false
            isSubmitting = true

            // get statuses
            invoiceRev = invoiceDoc._rev
            lookForPayment()
        }

        window.addEventListener("online", lookForPayment)
        document.addEventListener("visibilitychange", pageChanged)

    })

    onDestroy(() => {
        if (typeof window !== "undefined") {
            window.removeEventListener("online", lookForPayment)
            document.removeEventListener("visibilitychange", pageChanged)
        }
    })

    async function pageChanged() {
        console.log('Visiblity changed', document.visibilityState)
        if (document.visibilityState === "visible") {
            lookForPayment()
        }
    }


    async function initializeRatesAndDefaultValues() {
        /* if found matching rate, set to default value in local currency
            * otherwise just use sats */
        rates = await processCurrentRates()
        if (rates[targetCurrency]) {
            workingValue = rates[targetCurrency]
            /* denominate everything in local currency */
            console.log('Using local currency')
            // workingValue = Math.round(valueNow * 10000 / storedRates[userLocalCurrency])
        } else {
            targetCurrency = 'sats'
            workingValue = finalValueInSats
            console.log('Using straight sats')
        }
    }

    function setSatsValue(event) {
        const valueNow = parseFloat(event.currentTarget.value)
        if (valueNow) {
            finalValueInSats = Math.round(valueNow * 10000 / rates[targetCurrency])
        } else {
            finalValueInSats = 0
        }
    }

    async function handleSuccess(data) {
        isSuccess = true
        invoiceDoc = await data.response.json()
        console.log('Got success', invoiceDoc)
        invoiceRev = invoiceDoc._rev
        // might want to persist invoice data to local storage to reuse in case of refresh
        localStorage.setItem('active', JSON.stringify(invoiceDoc))
        const currentRev = await getCurrentPaymentRevision(invoiceDoc._id)
        localStorage.setItem('start_rev', currentRev)
        console.log('Rev of invoice moment', currentRev)
        // trigger watch for invoiceDoc._id
        lookForPayment(currentRev)
    }

    function lookForPayment() {
        setTimeout(async () => {
            const currentRev = localStorage.getItem('start_rev')
            await watchForPaymentComplete(invoiceDoc._id, currentRev, paymentComplete)
        })
    }

    function paymentComplete(status) {
        console.log('Completion status', status)
        if (status && status.results.length) {
            isPaid = true
            localStorage.removeItem('active')
        }
    }

    function cancelTransaction() {
        localStorage.removeItem('active')
        isSubmitting = false
        isSuccess = false
    }

    function handleError() {
    }

    function handleOnSubmit() {
        isSubmitting = true
    }

</script>

<section>
    <form
            class:loading={isSubmitting}
            on:submit={handleOnSubmit}
            method="POST"
            action="/fulger/tip"
            use:enhance={{
                    result: handleSuccess,
                    error: handleError
                }}>

        <div class="sats-value">
            <div>Zap me <SatoshiDisplay value={finalValueInSats}/> sats</div>
            <svg width="33" height="33" viewBox="0 0 33 33" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M27 0H6C2.68629 0 0 2.68629 0 6V27C0 30.3137 2.68629 33 6 33H27C30.3137 33 33 30.3137 33 27V6C33 2.68629 30.3137 0 27 0Z" fill="url(#paint0_linear_409_335)"/>
                <mask id="mask0_409_335" style="mask-type:luminance" maskUnits="userSpaceOnUse" x="6" y="6" width="21" height="21">
                    <path d="M26.4001 6.6001H6.6001V26.4001H26.4001V6.6001Z" fill="white"/>
                </mask>
                <g mask="url(#mask0_409_335)">
                    <path d="M22.5956 14.2342C22.5596 14.1707 22.5074 14.1179 22.4444 14.0811C22.3813 14.0444 22.3097 14.025 22.2367 14.025H16.8329L17.7389 7.10296C17.7486 7.01031 17.7269 6.91711 17.6772 6.83831C17.6275 6.75951 17.5527 6.69976 17.4649 6.66861C17.3771 6.63751 17.2814 6.63681 17.1932 6.66671C17.105 6.69661 17.0294 6.75531 16.9786 6.83336L10.407 18.3465C10.3686 18.409 10.3475 18.4806 10.346 18.554C10.3445 18.6273 10.3626 18.6998 10.3984 18.7638C10.4342 18.8278 10.4864 18.8812 10.5497 18.9183C10.613 18.9554 10.685 18.975 10.7584 18.975H16.0814L15.3634 25.9075C15.3564 25.9998 15.3804 26.0919 15.4317 26.1689C15.4829 26.246 15.5585 26.3038 15.6464 26.3329C15.7343 26.3621 15.8294 26.3611 15.9166 26.33C16.0038 26.2989 16.0781 26.2395 16.1277 26.1613L22.5906 14.6494C22.6281 14.5868 22.6483 14.5154 22.6492 14.4425C22.65 14.3695 22.6316 14.2976 22.5956 14.2342Z" fill="white"/>
                </g>
                <defs>
                    <linearGradient id="paint0_linear_409_335" x1="1.65" y1="1.32" x2="31.515" y2="33" gradientUnits="userSpaceOnUse">
                        <stop stop-color="#FF6E40"/>
                        <stop offset="1" stop-color="#FFE458"/>
                    </linearGradient>
                </defs>
            </svg>
        </div>

        <input type="hidden" value={targetCurrency} name="currency">
        {#if targetCurrency !== 'sats'}
            <div class="fiat-value">
                <div class="currency">{targetCurrency}&nbsp;</div>
                <input
                        type="number"
                        inputmode="numeric"
                        placeholder="x"
                        min="0.1"
                        step="any"
                        name="value"
                        required
                        bind:value={workingValue}
                        on:input="{setSatsValue}"
                >
            </div>
        {/if}

        <button class="pay"
                data-goatcounter-click="pressed-do-it"
                data-goatcounter-title="Initiated payment">Donate</button>
    </form>

    <div class="loader" class:loading={isSubmitting && !isSuccess}></div>

    <div class="invoice" class:showing={isSuccess && !isPaid}>
        <h3>{invoiceDoc.sats_total} sats</h3>
        <a href={`lightning:${invoiceDoc.ln_invoice_req}`}>
            <img src={invoiceDoc.ln_invoice_qr}/>
        </a>
        <div class="raw-lnurl">
            <input type="text" value={invoiceDoc.ln_invoice_req}>
            <button on:click={copyToClipboard}>Copy</button>
        </div>
        <p>Scan or click to pay</p>
        <a on:click={cancelTransaction} data-goatcounter-click="pressed-cancel">Cancel transaction</a>
    </div>

    {#if isSuccess && isPaid}
        <p>Thank you for your payment.</p>
    {/if}

</section>

<style lang="postcss">
    section {
        background: #FFFFFF;
        box-shadow: 0px 0px 55px 0px rgba(183, 193, 205, 1);
        border-radius: 22px;
        padding: 40px;
        min-width: 275px;
    }
    form {
        display: flex;
        flex-direction: column;
        margin: 60px 0;
    }
    form.loading {
        display: none;
    }

    .loader.loading {
        display: block;
    }

    h3 {
        text-align: center;
    }

    .loader,
    .loader:after {
        border-radius: 50%;
        width: 5em;
        height: 5em;
    }

    .loader {
        display: none;
        margin: 0 auto;
        font-size: 8px;
        position: relative;
        text-indent: -9999em;
        border-top: 1.1em solid rgba(255, 71, 71, 0.2);
        border-right: 1.1em solid rgba(255, 71, 71, 0.2);
        border-bottom: 1.1em solid rgba(255, 71, 71, 0.2);
        border-left: 1.1em solid #ff4747;
        -webkit-transform: translateZ(0);
        -ms-transform: translateZ(0);
        transform: translateZ(0);
        -webkit-animation: load8 1.1s infinite linear;
        animation: load8 1.1s infinite linear;
    }

    input[type="number"] {
        background-color: var(--color-bg-field);
        border: none;
        font-style: normal;
        font-weight: 500;
        font-size: 20px;
        line-height: 26px;
        width: 100%;
        padding: 7px 12px;
        border-radius: 10px;
    }

    button.pay {
        margin: 1rem 0;
        background-color: var(--color-theme-3);
        color: #FFF;
        border: none;
        padding: 15px 5px;
        cursor: pointer;
        border-radius: 10px;
        font-weight: 700;
        text-transform: uppercase;
        font-size: 13px;
        letter-spacing: 2px;
    }

    @-webkit-keyframes load8 {
        0% {
            -webkit-transform: rotate(0deg);
            transform: rotate(0deg);
        }
        100% {
            -webkit-transform: rotate(360deg);
            transform: rotate(360deg);
        }
    }

    @keyframes load8 {
        0% {
            -webkit-transform: rotate(0deg);
            transform: rotate(0deg);
        }
        100% {
            -webkit-transform: rotate(360deg);
            transform: rotate(360deg);
        }
    }

    .invoice {
        display: none;
        text-align: center;
    }

    .invoice img {
        max-width: 100%;
    }

    .invoice.showing {
        display: flex;
        flex-direction: column;
    }
    .raw-lnurl {
        display: flex;
    }
    .raw-lnurl input {
        flex: 1;
    }

    .sats-value {
        display: flex;
        align-items: center;
    }

    .sats-value svg {
        margin-left: auto;
    }

    .fiat-value {
        margin-top: 25px;
        display: flex;
        align-items: center;
    }
</style>
