export async function processCurrentRates() {
    const response = await fetch('/fulger/rates', {
        method: 'GET',
        headers: {
            accept: 'application/json'
        }
    })
    if (response.ok) {
        return await response.json()
    }
    console.log('No rates returned', response.status)
    return {}
}

export async function watchForPaymentComplete(orderId, successCallback) {
    let loopRunningIndefinetly = true
    while (loopRunningIndefinetly) {
        console.log('Querying couch feed')
        const response = await fetch('/fulger/order/' + orderId, {
            method: 'GET',
            headers: {
                accept: 'application/json'
            }
        })
        console.log('ok', response.ok, response.status)
        if (response.ok) {
            const feed = await response.json()
            successCallback(feed)
            loopRunningIndefinetly = (feed.results.length === 0)
        }
    }
}
