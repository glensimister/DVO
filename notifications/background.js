chrome.browserAction.setBadgeBackgroundColor({
    color: "#dd4b39"
});
chrome.browserAction.setBadgeText({
    text: "3"
});

// The ID of the extension we want to talk to.
var laserExtensionId = "bnmeokbnbegjnbddihbidleappfkiimj";

// Start a long-running conversation:
var port = chrome.runtime.connect(laserExtensionId);
port.postMessage({
    request: "isUserLoggedIn"
});
port.onMessage.addListener(function (res) {
    console.log(res);
});
