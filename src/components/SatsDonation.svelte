<script>
    import {processCurrentRates, watchForPaymentComplete, getCurrentPaymentRevision} from '$lib/fulger.js'
    import {copyToClipboard} from '$lib/clipboard.js'
    import currencyMatches from '$lib/language_currencies.js'
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
        <h3>Zap me {finalValueInSats} sats</h3>
        <input type="hidden" value={targetCurrency} name="currency">
        {#if targetCurrency !== 'sats'}
            <div>
                {targetCurrency}
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
                data-goatcounter-title="Initiated payment">Do it</button>
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

<style>
    form {
        display: flex;
        flex-direction: column;
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

    button.pay {
        margin: 1rem 0;
        background-color: var(--color-theme-1);
        color: #FFF;
        border: none;
        padding: 15px 5px;
        cursor: pointer;
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
</style>
