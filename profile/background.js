chrome.runtime.onInstalled.addListener(function () {
    var context = "image";
    var title = "Make this your profile picture";
    var id = chrome.contextMenus.create({
        "title": title,
        "contexts": [context],
        "id": "context" + context
    });
});

chrome.contextMenus.onClicked.addListener(onClickHandler);

function onClickHandler(info, tab) {
    window.confirm(`Are you sure you want to make ${info.srcUrl} your profile picture?`);
};