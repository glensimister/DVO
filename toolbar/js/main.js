/* I can't get the web3 window object from the extension so i had to inject the script and then post a message back to the content script */

/*
    function injectScript(file, node) {
        var th = document.getElementsByTagName(node)[0];
        var s = document.createElement('script');
        s.setAttribute('type', 'text/javascript');
        s.setAttribute('src', file);
        shadowRoot.appendChild(s);
    }

    injectScript(chrome.extension.getURL('js/getEthBal.js'), 'body');

    Number.prototype.toFixedNoRounding = function (n) {
        const reg = new RegExp("^-?\\d+(?:\\.\\d{0," + n + "})?", "g")
        const a = this.toString().match(reg)[0];
        const dot = a.indexOf(".");
        if (dot === -1) { // integer, insert decimal dot and pad up zeros
            return a + "." + "0".repeat(n);
        }
        const b = n - (a.length - dot) + 1;
        return b > 0 ? (a + "0".repeat(b)) : a;
    }

    let ethBal = shadowRoot.querySelector(".eth-bal");
    let bal = parseFloat(localStorage.getItem("balance"));
    var port = chrome.runtime.connect();
    window.addEventListener("message", function (event) {
        // We only accept messages from ourselves
        if (event.source != window)
            return;
        if (event.data.type && (event.data.type == "FROM_TOOLBAR")) {
            let balance = event.data.balance;
            $(ethBal).html(balance.toFixedNoRounding(3));
        }
    });*/


