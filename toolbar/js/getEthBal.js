if (typeof window.ethereum === 'undefined') {
    console.log('cannot access web3 in chrome extension')
} else {
    let yourAddress = web3.eth.defaultAccount;
    web3.eth.getBalance(yourAddress, function (error, wei) {
        if (!error) {
            var balance = web3.fromWei(wei, 'ether');
            console.log(balance + " ETH");
            balance = parseFloat(balance);
            window.postMessage({
                type: "FROM_TOOLBAR",
                balance: balance
            }, "*");
        }
    });
}
