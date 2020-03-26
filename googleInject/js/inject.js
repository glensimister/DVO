chrome.extension.sendMessage({}, function (response) {
    var readyStateCheckInterval = setInterval(function () {
        if (document.readyState === "complete") {
            clearInterval(readyStateCheckInterval);
            const stars = chrome.extension.getURL("css/style.css");
            let inject = `
<link rel="stylesheet" href="${stars}">
<div class="g">
    <div>
<x-star-rating value="3" number="5"></x-star-rating>
        <div>
            <div><a href="https://dvosuspension.com/suspension-forks/"><h3 class="LC20lb">This item has been injected into the page by DVO</h3><br>
<div><cite class="iUh30 bc">https://dvo.org › The evolution of decentralized governance</cite></div></a>
        </div>
        <div class="s">
            <div><span class="st">DVO is a decentralized social media platform / governance model...</span></div>
        </div>
    </div>
</div>
</div>`;
            $('#gsr #search').prepend(inject);
        }
    }, 10);
});