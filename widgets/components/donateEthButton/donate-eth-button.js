class DonateEthButton extends HTMLElement {
    async connectedCallback() {
        const shadowRoot = this.attachShadow({
            mode: 'open'
        });

        const styleSheet = chrome.extension.getURL("components/donateEthButton/style.css");

        shadowRoot.innerHTML = `
    <style>@import "${styleSheet}";</style>
    <div id="amount" contenteditable="true">0.0010</div>
    <div id="donate"><b>DONATE</b> ETH</div>`;

        function injectScript(file, node) {
            var th = document.getElementsByTagName(node)[0];
            var s = document.createElement('script');
            s.setAttribute('type', 'text/javascript');
            s.setAttribute('src', file);
            shadowRoot.appendChild(s);
        }

        injectScript(chrome.extension.getURL('js/injectWeb3.js'), 'body');

        var tipButton = shadowRoot.getElementById('donate');
        tipButton.addEventListener('click', function () {
            var port = chrome.runtime.connect();
            //NOTE: I cannot access the web3 object from this content script so i must send amount to message to injectWeb3.js. 
            window.postMessage({
                type: "FROM_WIDGETS",
                amount: shadowRoot.getElementById('amount').innerHTML
            }, "*");
        });
    }
}

customElements.define('donate-eth-button', DonateEthButton);
