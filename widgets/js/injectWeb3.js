// uses window.postMessage to get amount from content script
window.addEventListener("message", function (event) {
    // We only accept messages from ourselves
    if (event.source != window)
        return;

    if (event.data.type && (event.data.type == "FROM_WIDGETS")) {
        let amount = event.data.amount;
        let yourAddress = web3.eth.defaultAccount;
        const value = web3.toWei(amount, "ether");
        const desiredNetwork = '3';
        if (typeof window.ethereum === 'undefined') {
            alert('Looks like you need a Dapp browser to get started.')
            alert('Consider installing MetaMask!')
        } else {
            ethereum.enable()
                .catch(function (reason) {
                    if (reason === 'User rejected provider access') {} else {
                        alert('There was an issue signing you in.')
                    }
                })
                .then(function (accounts) {
                    if (ethereum.networkVersion !== desiredNetwork) {
                        alert('This application requires the main network, please switch it in your MetaMask UI.')
                    }
                    const account = accounts[0]
                    sendEtherFrom(account, function (err, transaction) {
                        if (err) {
                            return alert(`Sorry you weren't able to contribute!`)
                        }

                        alert('Thanks for your successful contribution!')
                    })

                })
        }
        function sendEtherFrom(account, callback) {
            const method = 'eth_sendTransaction'
            const parameters = [{
                from: account,
                to: yourAddress,
                value: value,
             }]
            const from = account

            const payload = {
                method: method,
                params: parameters,
                from: from,
            }

            ethereum.sendAsync(payload, function (err, response) {
                const rejected = 'User denied transaction signature.'
                if (response.error && response.error.message.includes(rejected)) {
                    return alert(`We can't take your money without your permission.`)
                }

                if (err) {
                    return alert('There was an issue, please try again.')
                }

                if (response.result) {
                    const txHash = response.result
                    alert('Thank you for your generosity!')
                    pollForCompletion(txHash, callback)
                }
            })
        }

        function pollForCompletion(txHash, callback) {
            let calledBack = false
            const checkInterval = setInterval(function () {

                const notYet = 'response has no error or result'
                ethereum.sendAsync({
                    method: 'eth_getTransactionByHash',
                    params: [txHash],
                }, function (err, response) {
                    if (calledBack) return
                    if (err || response.error) {
                        if (err.message.includes(notYet)) {
                            return 'transaction is not yet mined'
                        }

                        callback(err || response.error)
                    }
                    const transaction = response.result
                    clearInterval(checkInterval)
                    calledBack = true
                    callback(null, transaction)
                })
            }, 2000)
        }
    }
}, false);
