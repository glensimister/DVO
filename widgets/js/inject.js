chrome.extension.sendMessage({}, function (response) {
    var readyStateCheckInterval = setInterval(function () {
        if (document.readyState === "complete") {
            clearInterval(readyStateCheckInterval);
            $('a:contains("donateEth@")').replaceWith(`<donate-eth-button></donate-eth-button>`);
            $('a:contains("donateSocialCredits@")').replaceWith(`<donate-social-credits></donate-social-credits>`);
        }
    }, 10);
});
