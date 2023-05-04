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

export async function watchForPaymentComplete(orderId, startRev, successCallback) {
    let loopRunningIndefinetly = true
    while (loopRunningIndefinetly) {
        console.log('Querying couch feed', startRev)
        try {
            const response = await fetch('/fulger/order/' + orderId, {
                method: 'GET',
                headers: {
                    accept: 'application/json',
                    'x-start-rev': startRev
                }
            })
            console.log('ok', response.ok, response.status)
            if (response.ok) {
                const feed = await response.json()
                successCallback(feed)
                loopRunningIndefinetly = (feed.results.length === 0)
            }
            if (response.status >= 500) {
                console.log('Stopping due to invalid response, probably server issue')
            }
        } catch (e) {
            console.log('Some error happened on the changes watch', e.message)
            loopRunningIndefinetly = false
            // tab disconnected or closed somehow
            // need to restart order watch from the sequence
            // await errorCallback()
        }
    }
}

export async function getCurrentPaymentRevision(orderId) {
    try {
        console.log('Getting rev')
        const response = await fetch('/fulger/order/' + orderId, {
            method: 'GET',
            headers: {
                accept: 'application/json',
                'x-rev': 'true'
            }
        })
        console.log('ok', response.ok, response.status)
        if (response.ok) {
            const feed = await response.json()
            console.log('Got revision', feed.last_seq)
            return feed.last_seq
        }
        return null
    } catch (e) {
        console.log("Cannot retrieve payment revision")
        return null
    }
}
