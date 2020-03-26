class DonateSocialCredits extends HTMLElement {
    connectedCallback() {
        const shadowRoot = this.attachShadow({
            mode: 'closed'
        });

        const styleSheet = chrome.extension.getURL("components/donateSocialCredits/style.css");
        const jquery = chrome.extension.getURL("js/jquery-3.3.1.js");

        let thumbsUpBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPCAYAAAA71pVKAAABYklEQVQokY2SsYoTYRSFv28YFgmLiJUsFsvYWEoQwcHWZqext7IQLcUXsPAJrK1sfAAhPkHIdoKVEMiwSKpUEsIiIeRYzG6UmKye5ue/9z/n3HP5DWEf2qY+CKkIizufT6fb/WIvs8Ndwnv1XdvUx9vN8ipm4L5YB34Y+sDZfzm3J/V1wzOkIFkhi+037so8aR4eCm/A1yEF+EV4GpiTnKvzajBal5OmvknSR0rjAvKd8AJ8CSlUIH3wm8kaHYY8B8alcA/8AJTIDPgkvgJ64OWAF4cF8EA8BsYl0EOOLhZUgLdMeijb6CI6hkx/LyyXC8if179gN8FcPN+QY+aEMxQS3OHaqQZhmmQGUKQrtMjHLpb7/5wuga/qT4BCnYPXIE8CLWQizIBFNjE2cgtgWA1G6y7mDp/2pD6KPII8NtxGD4FVYCh5Ww1Ol3vJG5GmPgBukPSiK2FWDUbLTYqryP/CLycdkbNyK7wcAAAAAElFTkSuQmCC';
        let thumbsDownBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPCAYAAAA71pVKAAABJElEQVQokaWTsUoDURBFzw0hpFhCKr8gCIloYWUhFhYW1iv+hNj4AZbiH9gI6ROstBCClV8QggvBRrCyCCIBrfZarCaPzTOCDgxTvDncO8M8GfPXqC57VC9LECtFnydYEx+08xmsflYF10GA86KyijlEbMI3rBfwGTAIlfeBS+ADNAUPgCOkiBW9hnAFqIEesa+ABijBArOYsKt+loQwwBbS8Vzhh4Qm0CrDX2Hwr9vfCGcO2Mic5TBrAewx5gJUQzyBx6Bt7BZS4SSsuD6bLnYk6j/sgG4wCSIHroER9jui67TzvGh7jt8DJ4hzTBMxxT5F5E47syOJKhfqWQO7h7QHjJy218s9lQhX7CVtvyHdgifAXaxn6W0DXcwQMYy6+8+v+gQW1WVtnBrREAAAAABJRU5ErkJggg==';

        shadowRoot.innerHTML = `
    <style>@import "${styleSheet}";</style>
    <script src="${jquery}"></script>
    <div id="projectAuthor"><a target=_blank href="https://devolution.inrupt.net/profile/card#me"><img id="photo" src="https://devolution.inrupt.net/profile/profilepic.jpg"><span id="name">Glen Simister</span></a></div>
    <div id="projectDesc">Loading project description...</div>
    <div id="projectButtons">
    <div><div><img src="${thumbsUpBase64}"/></div><div>10</div></div>
    <div><div><img src="${thumbsDownBase64}"/></div><div>1</div></div>
    <div id="score">90%</div>
    <div><div><b>TARGET</b></div><div>5000 ETH</div></div>
    <div><div><b>RAISED</b></div><div>1200 ETH</div></div>
    <div id="amount" contenteditable="true">0.001</div>
    <div id="donate">DONATE</div>
    </div>`;

        let url = "https://devolution.inrupt.net/public/posts/54518.html";
        let desc = shadowRoot.getElementById("projectDesc");

        var port = chrome.runtime.connect({
            name: "knockknock"
        });
        port.postMessage({
            joke: "Knock knock"
        });
        port.onMessage.addListener(function (msg) {
            $(desc).html(msg.msg);
        });

    }
}

customElements.define('donate-social-credits', DonateSocialCredits);
