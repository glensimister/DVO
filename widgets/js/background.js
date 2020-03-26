chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        console.log(sender.tab ?
            "from a content script:" + sender.tab.url :
            "from the extension");
        if (request.message == "setWeb3")
            sendResponse({
                web3: request.web3
            });
    });

chrome.runtime.onConnect.addListener(function (port) {
    port.onMessage.addListener(function (msg) {
        if (msg.joke == "Knock knock") {
            let url = "https://devolution.inrupt.net/public/posts/54518.html";
            getHTML(url, function (data) {
                    port.postMessage({
                        msg: data
                    });
                });
        }
        return true;
    });
});

function getHTML(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function () {
        if (this.readyState !== 4) return;
        if (this.status !== 200) return;
        callback(this.responseText);
    };
    xhr.send();
}

/*
chrome.runtime.onConnect.addListener(port => {
    port.onMessage.addListener(request => {
        if (request.type) {
            fetch(request.type).then(function (data) {
                sendResponse({
                    data: data
                });
            });
        }
    });
});
*/
//chrome.runtime.onMessage.addListener((request, sender, sendResponse) => sendResponse('pong'));

/*
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
        console.log(request.type);
        let response = await fetch(request.type);
        let json = await response.json();
        sendResponse({desc: json});
  });*/
