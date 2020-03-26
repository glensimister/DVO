class ToolBarBottom extends HTMLElement {
    connectedCallback() {
        const shadowRoot = this.attachShadow({
            mode: 'closed'
        });

        const toolBarCss = chrome.extension.getURL("css/toolBar.css");
        const fontAwesome = chrome.extension.getURL("css/font-awesome.min.css");
        const jquery = chrome.extension.getURL("js/jquery-3.3.1.js");
        const gunJs = chrome.extension.getURL("js/gun.js");
        const seaJs = chrome.extension.getURL("js/sea.js");
        let url = window.location.toString();
        const laserExtensionId = "bnmeokbnbegjnbddihbidleappfkiimj";
        const port = chrome.runtime.connect(laserExtensionId);

        /***************** GET DATA *******************/

        (async function () {

            let likeClass = "red";
            let dislikeClass = "blue";
            let totLikes = 0;
            let totDislikes = 0;
            let score = 0;
            let hasLiked = false;
            let hasDisliked = false;
            let totalLikes = null;
            let val;

            totalLikes = await getPageLikes();
            totLikes = totalLikes.likes;
            totDislikes = totalLikes.dislikes;
            hasLiked = totalLikes.hasLiked;
            hasDisliked = totalLikes.hasDisliked;
            score = calculateScore();

            function calculateScore() {
                score = totLikes + totDislikes;
                score = (totLikes / score) * 100;
                score = Math.round(score);
                return score;
            }

            if (hasLiked)
                likeClass = "gray";
            if (hasDisliked)
                dislikeClass = "gray";

            async function getPageLikes() {
                return new Promise(resolve => {
                    port.postMessage({
                        type: "getNumPageLikes",
                        pageUrl: url
                    });
                    port.onMessage.addListener(function (res) {
                        if (res.type === "pageLikes") {
                            resolve(res);
                        }
                    });
                });
            }

            shadowRoot.innerHTML = `
<link rel="stylesheet" href="${toolBarCss}">
<link rel="stylesheet" href="${fontAwesome}">
<script src="${jquery}"></script>
<script src="${gunJs}"></script>
<script src="${seaJs}"></script>
<div id="close">
<div><span class="arrow">&#9650;</span></div>
</div>
<div class="toolbar-bottom">
<div id="like"><i class="${likeClass} fa fa-thumbs-up"></i></div>
<div id="likes">${totLikes}</div>
<div id="dislike"><i class="${dislikeClass} fa fa-thumbs-down"></i></div>
<div id="dislikes">${totDislikes}</div>
<div><span id="score">${score}</span>%</div>
</div>
`;

            let likes = shadowRoot.getElementById("likes");
            let like = shadowRoot.getElementById("like");
            let dislikes = shadowRoot.getElementById("dislikes");
            let dislike = shadowRoot.getElementById("dislike");
            let close = shadowRoot.getElementById("close");
            let scoreDiv = shadowRoot.getElementById("score");
            let toolbar = shadowRoot.querySelector(".toolbar-bottom");


            async function isUserLoggedIn() {
                return new Promise(resolve => {
                    port.postMessage({
                        type: "isUserLoggedIn"
                    });
                    port.onMessage.addListener(function (res) {
                        if (res.type == "loggedIn" && res.response) { // this should be isLoggedIn. change in background.js of API
                            resolve(true);
                        }
                    });
                });
            }


            $(close).on('click', function () {
                $(toolbar).toggleClass("toolbar-slide-up");
                $(close).toggleClass("arrow-slide-up");
                $(close).find('.arrow').toggleClass('rotate');
            });

            function getDate() {
                var d = new Date();
                var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                let day = d.getDate();
                let month = monthNames[d.getMonth()];
                let year = d.getFullYear();
                let date = `${day} ${month}, ${year}`;
                return date;
            }

            $(like).on('click', async function () {

                $(like).find('i').toggleClass("red gray");

                port.postMessage({
                    type: "likePage",
                    pageUrl: url,
                    date: getDate()
                });

                // if the page hasn't already been liked, toggle the class, else, do nothing

                port.onMessage.addListener(function (res) {
                    if (res.type === "fromLikePage") {
                        console.log(res);
                        if (!res.hasLiked) {
                            // if it hasn't already been liked, add 1
                            val = $(likes).html();
                            val++;
                            $(likes).html(val);
                            // and substract 1 from dislikes if val is greater than 0
                            val = $(dislikes).html();
                            if (val > 0) {
                                val--;
                                $(dislikes).html(val);
                            }
                        } else {
                            // substract 1 from likes
                            val = $(likes).html();
                            if (val > 0) {
                                val--;
                            }
                            $(likes).html(val);
                            console.log("page has already been liked");
                        }
                    }
                });
            });

            $(dislike).on('click', async function () {

                $(dislike).find('i').toggleClass("blue gray");

                port.postMessage({
                    type: "dislikePage",
                    pageUrl: url,
                    date: getDate()
                });

                // if the page has already been liked, retract the like, else, toggle class

                port.onMessage.addListener(function (res) {
                    if (res.type === "fromDislikePage") {
                        console.log(res);
                        if (!res.hasDisliked) {
                            // if it hasn't already been liked, add 1
                            val = $(dislikes).html();
                            val++;
                            $(dislikes).html(val);
                            // and substract 1 from dislikes if val is greater than 0
                            val = $(likes).html();
                            if (val > 0) {
                                val--;
                                $(likes).html(val);
                            }
                        } else {
                            // substract 1 from likes
                            val = $(dislikes).html();
                            if (val > 0) {
                                val--;
                            }
                            $(dislikes).html(val);
                            console.log("page has already been disliked");
                        }
                    }
                });
            });
        })();
    }
}

customElements.define('toolbar-bottom', ToolBarBottom);
