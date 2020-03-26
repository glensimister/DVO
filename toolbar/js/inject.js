chrome.extension.sendMessage({}, function (response) {
    var readyStateCheckInterval = setInterval(function () {
        if (document.readyState === "complete") {
            clearInterval(readyStateCheckInterval);
            $('html').append("<toolbar-bottom></toolbar-bottom>");
        }
    }, 10);
});
