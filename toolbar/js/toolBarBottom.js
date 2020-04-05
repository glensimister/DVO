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
            let obj = null;

            obj = await getPageLikes();
            /*obj = await getPageLikes();
            totLikes = parseInt(obj.likes);
            totDislikes = parseInt(obj.dislikes);
            hasLiked = obj.hasLiked;
            hasDisliked = obj.hasDisliked;
            score = obj.pageScore;*/

            if (obj.likedAlready)
                likeClass = "gray";
            if (obj.dislikedAlready)
                dislikeClass = "gray";

            async function getPageLikes() {
                return new Promise(resolve => {
                    port.postMessage({
                        type: "getPageLikes",
                        pageUrl: url
                    });
                    port.onMessage.addListener(function (res) {
                        if (res.type === "getPageLikes") {
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
<div id="likes">${obj.likes}</div>
<div id="dislike"><i class="${dislikeClass} fa fa-thumbs-down"></i></div>
<div id="dislikes">${obj.dislikes}</div>
<div><span id="score">${obj.score}</span>%</div>
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

            $(like).on('click', async function (e) {
                e.stopImmediatePropagation();
                $(like).find('i').toggleClass("red gray");
                $(dislike).find('i').removeClass("gray");
                $(dislike).find('i').addClass("blue");

                port.postMessage({
                    type: "likePage",
                    reactType: 'like',
                    pageUrl: url,
                    date: getDate()
                });
                
                port.onMessage.addListener(function (res) {
                    if (res.type === "getPageLikes") {
                        console.log(res);
                        $(dislikes).html(res.dislikes);
                        $(likes).html(res.likes);
                        $(scoreDiv).html(res.score);
                    }
                });


                // i'm not sure what to do with the title (document.title) yet. 
                // I need to get the title and description of the page. maybe it would be better to pull this from google on the fly

                port.onMessage.addListener(function (res) {
                    if (res.type === "pageReviews") {
                        console.log(res);
                        $(dislikes).html(res.dislikes);
                        $(likes).html(res.likes);
                        $(scoreDiv).html(res.pageScore);

                        if (!res.hasLiked) {
                            console.log("page has not already been liked");
                        } else {
                            console.log("page has already been liked");
                        }
                    }
                });
            });


            $(dislike).on('click', async function (e) {
                e.stopImmediatePropagation();
                $(dislike).find('i').toggleClass("blue gray");
                $(like).find('i').removeClass("gray");
                $(like).find('i').addClass("red");

                port.postMessage({
                    type: "likePage",
                    reactType: 'dislike',
                    pageUrl: url,
                    date: getDate()
                });
                
                port.onMessage.addListener(function (res) {
                    if (res.type === "getPageLikes") {
                        console.log(res);
                        $(dislikes).html(res.dislikes);
                        $(likes).html(res.likes);
                        $(scoreDiv).html(res.score);
                    }
                });

                port.onMessage.addListener(function (res) {
                    if (res.type === "pageReviews") {
                        console.log(res);
                        $(dislikes).html(res.dislikes);
                        $(likes).html(res.likes);
                        $(scoreDiv).html(res.pageScore);

                        /*if (res.hasLiked) {
                            $(like).find('i').toggleClass("gray red");
                        }*/

                        if (!res.hasDisliked) {
                            console.log("page has not already been disliked");
                        } else {
                            console.log("page has already been disliked");
                        }
                    }
                });
            });
        })();
    }
}

customElements.define('toolbar-bottom', ToolBarBottom);
