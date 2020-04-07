/*chrome.browserAction.setBadgeBackgroundColor({
    color: "#dd4b39"
});
chrome.browserAction.setBadgeText({
    text: "3"
});*/

chrome.runtime.onConnect.addListener(function (port) {
    port.onMessage.addListener(async function (request) {


        if (request.type === "openComments") {
            let url = await getPageUrl();
            console.log(url);

            async function getPageUrl() {
                return new Promise(resolve => {
                    chrome.tabs.query({
                        'active': true,
                        'lastFocusedWindow': true
                    }, function (tabs) {
                        resolve(tabs[0].url);
                    });
                });
            }
            
            var left = (screen.width - 400) / 2;
            let popup =
                window.open("popup.html?url=" + url, "Comments", "width=400,height=554,left=" + left + ", top=20,status=no,scrollbars=yes,resizable=no");
        }
    });
});
